import { corsHeaders } from '../_shared/cors.ts'

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface ChatResponse {
  response: string;
  isEmotional: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationHistory = [] }: ChatRequest = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Load knowledge base
    const knowledgeBase = await loadKnowledgeBase()

    // Initialize chatbot logic
    const chatbot = new EmotionalChatbot(openaiApiKey, knowledgeBase)
    
    // Set conversation history
    chatbot.setConversationHistory(conversationHistory)

    // Process message and get response
    const isEmotional = await chatbot.detectEmotion(message)
    const response = await chatbot.generateResponse(message, isEmotional)

    const result: ChatResponse = {
      response,
      isEmotional
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Load knowledge base from file
async function loadKnowledgeBase(): Promise<Record<string, string>> {
  try {
    const kbPath = './knowledge_base.json'
    const kbText = await Deno.readTextFile(kbPath)
    const kbArray = JSON.parse(kbText)
    
    // Convert array to dictionary format expected by chatbot
    const kbDict: Record<string, string> = {}
    kbArray.forEach((item: any, index: number) => {
      if (item.question && item.answer) {
        kbDict[item.question] = item.answer
      } else {
        kbDict[`entry_${index}`] = JSON.stringify(item)
      }
    })
    
    return kbDict
  } catch (error) {
    console.error('Failed to load knowledge base:', error)
    return {}
  }
}

// Emotional Chatbot class adapted for Deno/TypeScript
class EmotionalChatbot {
  private apiKey: string
  private model: string = 'gpt-4o'
  private knowledgeBase: Record<string, string>
  private conversationHistory: Array<{ role: string; content: string }> = []

  constructor(apiKey: string, knowledgeBase: Record<string, string>) {
    this.apiKey = apiKey
    this.knowledgeBase = knowledgeBase
  }

  setConversationHistory(history: Array<{ role: string; content: string }>) {
    this.conversationHistory = history.slice(-6) // Keep last 6 messages
  }

  async detectEmotion(message: string): Promise<boolean> {
    try {
      const prompt = `
        Analyze the following message and determine if it contains emotional distress, mental health concerns, 
        or requests for emotional support.
        Respond only with:
        - "EMOTIONAL" if emotional content is detected
        - "NEUTRAL" if it's normal conversation.

        Message: "${message}"
      `

      const response = await this.callOpenAI([
        { role: 'user', content: prompt }
      ], 10, 0.1)

      return response.toUpperCase().includes('EMOTIONAL')
    } catch (error) {
      console.error('Emotion detection error:', error)
      return false
    }
  }

  async generateResponse(userMessage: string, isEmotional: boolean): Promise<string> {
    try {
      let prompt: string

      if (isEmotional) {
        const knowledgeContext = this.searchKnowledgeBase(userMessage)
        prompt = `
          You are a warm, empathetic AI Therapist.
          
          Relevant guidance from KB (reference only):
          ${knowledgeContext}

          User's message: ${userMessage}

          Instructions:
          - DO NOT copy KB directly
          - Summarize/adapt into warm, concise advice
          - Personalize response to the user
          - Offer practical, actionable tips if relevant
          - Keep tone natural, supportive, and conversational
          - Limit to 2-3 short paragraphs

          Response:
        `
      } else {
        prompt = `
          You are a friendly AI assistant named MINDMATE AI.
          Respond casually and helpfully without giving therapy unless asked.

          User's message: ${userMessage}

          Response:
        `
      }

      const messages = [
        { role: 'system', content: 'You are a helpful and empathetic AI assistant.' },
        ...this.conversationHistory,
        { role: 'user', content: prompt }
      ]

      const response = await this.callOpenAI(messages, 300, 0.7)
      
      // Update conversation history
      this.addToHistory(userMessage, response)
      
      return response
    } catch (error) {
      console.error('Response generation error:', error)
      return "I'm having trouble replying right now. Please try again."
    }
  }

  private searchKnowledgeBase(query: string, topK: number = 2): string {
    if (!this.knowledgeBase || Object.keys(this.knowledgeBase).length === 0) {
      return "No KB available."
    }

    try {
      // Simple keyword-based search (since we can't use sentence transformers in Deno)
      const queryWords = query.toLowerCase().split(/\s+/)
      const results: Array<{ key: string; value: string; score: number }> = []

      for (const [key, value] of Object.entries(this.knowledgeBase)) {
        const keyWords = key.toLowerCase().split(/\s+/)
        const valueWords = value.toLowerCase().split(/\s+/)
        
        let score = 0
        queryWords.forEach(word => {
          if (keyWords.some(kw => kw.includes(word) || word.includes(kw))) score += 2
          if (valueWords.some(vw => vw.includes(word) || word.includes(vw))) score += 1
        })

        if (score > 0) {
          results.push({ key, value, score })
        }
      }

      // Sort by score and take top results
      results.sort((a, b) => b.score - a.score)
      const topResults = results.slice(0, topK)

      if (topResults.length === 0) {
        return "No relevant KB guidance found."
      }

      return topResults
        .map(result => `Topic: ${result.key}\nGuidance: ${result.value}`)
        .join('\n\n')
    } catch (error) {
      console.error('KB search error:', error)
      return "Error searching KB."
    }
  }

  private async callOpenAI(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number,
    temperature: number
  ): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content?.trim() || "I'm having trouble responding right now."
  }

  private addToHistory(userMessage: string, botResponse: string) {
    this.conversationHistory.push({ role: 'user', content: userMessage })
    this.conversationHistory.push({ role: 'assistant', content: botResponse })
    
    // Keep only last 20 messages
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20)
    }
  }
}