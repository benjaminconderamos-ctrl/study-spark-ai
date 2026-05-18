export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["chat_role"]
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["chat_role"]
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["chat_role"]
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          id: string
          token_count: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          id?: string
          token_count?: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          error_message: string | null
          file_path: string
          file_size: number
          id: string
          page_count: number | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_path: string
          file_size?: number
          id?: string
          page_count?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_path?: string
          file_size?: number
          id?: string
          page_count?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_decks: {
        Row: {
          created_at: string
          document_id: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          flashcard_id: string
          id: string
          rating: Database["public"]["Enums"]["review_rating"]
          reviewed_at: string
          user_id: string
        }
        Insert: {
          flashcard_id: string
          id?: string
          rating: Database["public"]["Enums"]["review_rating"]
          reviewed_at?: string
          user_id: string
        }
        Update: {
          flashcard_id?: string
          id?: string
          rating?: Database["public"]["Enums"]["review_rating"]
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          deck_id: string
          difficulty: Database["public"]["Enums"]["card_difficulty"]
          id: string
          position: number
          question: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          deck_id: string
          difficulty?: Database["public"]["Enums"]["card_difficulty"]
          id?: string
          position?: number
          question: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          deck_id?: string
          difficulty?: Database["public"]["Enums"]["card_difficulty"]
          id?: string
          position?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_documents: {
        Row: {
          created_at: string
          document_id: string
          full_text: string
          id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          full_text: string
          id?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          full_text?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          user_answer: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          user_answer: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          user_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          id: string
          quiz_id: string
          score: number
          started_at: string
          total: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          quiz_id: string
          score?: number
          started_at?: string
          total?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number
          started_at?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          position: number
          prompt: string
          quiz_id: string
          type: Database["public"]["Enums"]["quiz_question_type"]
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          position?: number
          prompt: string
          quiz_id: string
          type: Database["public"]["Enums"]["quiz_question_type"]
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          position?: number
          prompt?: string
          quiz_id?: string
          type?: Database["public"]["Enums"]["quiz_question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          document_id: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          activity: Database["public"]["Enums"]["study_activity"]
          created_at: string
          document_id: string | null
          duration_seconds: number
          id: string
          user_id: string
        }
        Insert: {
          activity: Database["public"]["Enums"]["study_activity"]
          created_at?: string
          document_id?: string | null
          duration_seconds?: number
          id?: string
          user_id: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["study_activity"]
          created_at?: string
          document_id?: string | null
          duration_seconds?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          content: Json
          created_at: string
          document_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          document_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          document_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      card_difficulty: "easy" | "medium" | "hard"
      chat_role: "user" | "assistant"
      document_status:
        | "uploading"
        | "pending"
        | "processing"
        | "ready"
        | "failed"
      quiz_question_type: "multiple_choice" | "true_false" | "open"
      review_rating: "again" | "hard" | "good" | "easy"
      study_activity: "summary" | "flashcards" | "quiz" | "chat" | "upload"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      card_difficulty: ["easy", "medium", "hard"],
      chat_role: ["user", "assistant"],
      document_status: [
        "uploading",
        "pending",
        "processing",
        "ready",
        "failed",
      ],
      quiz_question_type: ["multiple_choice", "true_false", "open"],
      review_rating: ["again", "hard", "good", "easy"],
      study_activity: ["summary", "flashcards", "quiz", "chat", "upload"],
    },
  },
} as const
