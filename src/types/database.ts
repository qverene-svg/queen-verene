export type UserRole = "admin" | "manager" | "staff" | "customer";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "deposit_paid" | "fully_paid" | "refunded";
export type InquiryStatus = "new" | "contacted" | "payment_sent" | "finalized";
export type ApplicationStatus = "new" | "reviewed" | "shortlisted" | "rejected";
export type ServiceCategory = "pedicure" | "manicure" | "wig_making" | "wig_revamp" | "makeup" | "braiding" | "styling" | "hair_care";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      staff_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          specialty_tags: string[];
          rating: number;
          commission_rate: number;
        };
        Insert: Omit<Database["public"]["Tables"]["staff_profiles"]["Row"], never>;
        Update: Partial<Database["public"]["Tables"]["staff_profiles"]["Insert"]>;
      };
      staff_availability: {
        Row: {
          id: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["staff_availability"]["Row"], never>;
        Update: Partial<Database["public"]["Tables"]["staff_availability"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          name: string;
          duration_minutes: number;
          price: number;
          description: string | null;
          category: ServiceCategory;
          image_url: string | null;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["services"]["Row"], never>;
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      appointments: {
        Row: {
          id: string;
          customer_id: string;
          staff_id: string;
          service_id: string;
          start_time: string;
          end_time: string;
          status: AppointmentStatus;
          payment_status: PaymentStatus;
          total_price: number;
          deposit_paid: number;
          hubtel_transaction_ref: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["appointments"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          stock_level: number;
          is_available: boolean;
          image_urls: string[];
          category: string;
          sku: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_inquiries: {
        Row: {
          id: string;
          user_id: string | null;
          product_id: string;
          status: InquiryStatus;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_inquiries"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["product_inquiries"]["Insert"]>;
      };
      job_openings: {
        Row: {
          id: string;
          title: string;
          description: string;
          requirements: string;
          is_active: boolean;
          date_posted: string;
        };
        Insert: Omit<Database["public"]["Tables"]["job_openings"]["Row"], never>;
        Update: Partial<Database["public"]["Tables"]["job_openings"]["Insert"]>;
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_name: string;
          email: string;
          phone: string;
          cv_url: string | null;
          portfolio_url: string | null;
          status: ApplicationStatus;
          submitted_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["applications"]["Row"], "submitted_at">;
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
      };
      system_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["system_logs"]["Row"], "created_at">;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
