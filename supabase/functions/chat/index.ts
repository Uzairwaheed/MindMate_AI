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

    // Get OpenAI API key from environment - check multiple possible names
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || 
                         Deno.env.get('EXPO_PUBLIC_OPENAI_API_KEY') ||
                         Deno.env.get('SUPABASE_OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      const availableKeys = Object.keys(Deno.env.toObject()).filter(key => 
        key.toLowerCase().includes('openai') || key.toLowerCase().includes('api')
      )
      console.error('OPENAI_API_KEY not found in environment')
      console.error('Available API-related env vars:', availableKeys)
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('OpenAI API key found, length:', openaiApiKey?.length || 0)
    console.log('API key starts with:', openaiApiKey?.substring(0, 10) + '...')

    // Load knowledge base
    let knowledgeBase: Record<string, string> = {}
    try {
      knowledgeBase = await loadKnowledgeBase()
      console.log('Knowledge base loaded with', Object.keys(knowledgeBase).length, 'entries')
    } catch (error) {
      console.error('Failed to load knowledge base:', error)
      // Continue with empty knowledge base
    }

    // Initialize chatbot logic
    const chatbot = new EmotionalChatbot(openaiApiKey, knowledgeBase)
    
    // Set conversation history
    chatbot.setConversationHistory(conversationHistory)

    // Process message and get response
    let isEmotional = false
    let response = "I'm having trouble connecting right now. Please try again."
    
    try {
      isEmotional = await chatbot.detectEmotion(message)
      console.log('Emotion detection result:', isEmotional)
      
      response = await chatbot.generateResponse(message, isEmotional)
      console.log('Response generated successfully')
    } catch (chatbotError) {
      console.error('Chatbot processing error:', chatbotError)
      response = "I'm experiencing some technical difficulties. Please try again in a moment."
    }

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
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
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
    // Use the embedded knowledge base instead of reading from file
    const kbArray = KNOWLEDGE_BASE
    
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
    throw error
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
    try {
      console.log('Making OpenAI API call with model:', this.model)
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
        const errorText = await response.text()
        console.error('OpenAI API error:', response.status, response.statusText, errorText)
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('OpenAI API response received successfully')
      return data.choices[0]?.message?.content?.trim() || "I'm having trouble responding right now."
    } catch (error) {
      console.error('OpenAI API call failed:', error)
      throw error
    }
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