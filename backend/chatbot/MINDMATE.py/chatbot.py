"""
MINDMATE.py - FYP-ready Emotional Support Chatbot
Loads KB + embeddings once, detects emotions, and uses GPT for casual or therapy-style responses.
"""

import os
import json
import numpy as np
from typing import Dict
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# ==== Load environment variables ====
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY is missing. Please set it in your .env file.")

class EmotionalChatbot:
    def __init__(self, api_key: str, knowledge_base_path: str, model: str = "gpt-4o"):
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.knowledge_base = self._load_knowledge_base(knowledge_base_path)
        self.conversation_history = []

        print("🔄 Loading embedding model...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.kb_embeddings = self._create_kb_embeddings()

        self.emotion_detection_prompt = """
        Analyze the following message and determine if it contains emotional distress, mental health concerns, 
        or requests for emotional support.
        Respond only with:
        - "EMOTIONAL" if emotional content is detected
        - "NEUTRAL" if it's normal conversation.

        Message: "{message}"
        """

        self.therapeutic_response_prompt = """
        You are a warm, empathetic AI Therapist.
        
        Relevant guidance from KB (reference only):
        {knowledge_context}

        User's message: {user_message}

        Instructions:
        - DO NOT copy KB directly
        - Summarize/adapt into warm, concise advice
        - Personalize response to the user
        - Offer practical, actionable tips if relevant
        - Keep tone natural, supportive, and conversational
        - Limit to 2-3 short paragraphs

        Response:
        """

        self.normal_response_prompt = """
        You are a friendly AI assistant named MINDMATE AI.
        Respond casually and helpfully without giving therapy unless asked.

        User's message: {user_message}

        Response:
        """

    def _load_knowledge_base(self, path: str) -> Dict:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                kb = json.load(f)
            if isinstance(kb, list):
                print("⚠️ KB is a list. Converting to dictionary...")
                kb = {f"entry_{i}": item for i, item in enumerate(kb)}
            print(f"✅ KB loaded with {len(kb)} entries.")
            return kb
        except FileNotFoundError:
            print(f"⚠️ KB file '{path}' not found.")
            return {}
        except json.JSONDecodeError as e:
            print(f"❌ KB load error: {e}")
            return {}

    def _create_kb_embeddings(self):
        if not self.knowledge_base:
            print("⚠️ No KB entries to embed.")
            return np.array([])
        print(f"🔄 Creating embeddings for {len(self.knowledge_base)} KB entries...")
        questions = list(self.knowledge_base.keys())
        embeddings = self.embedding_model.encode(questions, convert_to_numpy=True)
        print("✅ KB embeddings created.")
        return embeddings

    def _detect_emotion(self, message: str) -> bool:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": self.emotion_detection_prompt.format(message=message)}],
                max_tokens=10,
                temperature=0.1
            )
            result = response.choices[0].message.content.strip().upper()
            return "EMOTIONAL" in result
        except Exception as e:
            print(f"⚠️ Emotion detection error: {e}")
            return False

    def _search_knowledge_base(self, query: str, top_k: int = 2) -> str:
        if not self.knowledge_base or self.kb_embeddings.size == 0:
            return "No KB available."
        try:
            query_embedding = self.embedding_model.encode([query], convert_to_numpy=True)
            similarities = cosine_similarity(query_embedding, self.kb_embeddings)[0]
            top_indices = similarities.argsort()[::-1][:top_k]
            results = []
            kb_keys = list(self.knowledge_base.keys())
            for idx in top_indices:
                if similarities[idx] > 0.1:
                    key = kb_keys[idx]
                    results.append(f"Topic: {key}\nGuidance: {self.knowledge_base[key]}")
            return "\n\n".join(results) if results else "No relevant KB guidance found."
        except Exception as e:
            print(f"⚠️ KB search error: {e}")
            return "Error searching KB."

    def _generate_response(self, user_message: str, is_emotional: bool) -> str:
        try:
            if is_emotional:
                kb_context = self._search_knowledge_base(user_message)
                prompt = self.therapeutic_response_prompt.format(
                    knowledge_context=kb_context,
                    user_message=user_message
                )
            else:
                prompt = self.normal_response_prompt.format(user_message=user_message)

            messages = [{"role": "system", "content": "You are a helpful and empathetic AI assistant."}]
            messages.extend(self.conversation_history[-6:])
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=300,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"❌ Response generation error: {e}")
            return "I’m having trouble replying right now."

    def _add_to_history(self, user_message: str, bot_response: str):
        self.conversation_history.append({"role": "user", "content": user_message})
        self.conversation_history.append({"role": "assistant", "content": bot_response})
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]

    def chat(self):
        print("🤖 MINDMATE AI started!")
        print("💬 Casual & emotional support mode active.")
        print("Type 'exit' to quit.\n")
        while True:
            try:
                user_input = input("You: ").strip()
                if user_input.lower() in ["exit", "quit", "bye"]:
                    print("👋 Take care!")
                    break
                if not user_input:
                    continue
                is_emotional = self._detect_emotion(user_input)
                response = self._generate_response(user_input, is_emotional)
                self._add_to_history(user_input, response)
                print(f"\n🤖 Bot: {response}\n")
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break

def setup_chatbot():
    KNOWLEDGE_BASE_PATH = "knowledge_base.json"
    MODEL = "gpt-4o"
    return EmotionalChatbot(api_key=OPENAI_API_KEY, knowledge_base_path=KNOWLEDGE_BASE_PATH, model=MODEL)

if __name__ == "__main__":
    chatbot = setup_chatbot()
    chatbot.chat()

is thi correct