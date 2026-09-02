import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aepfnfsfaskdxvnkvvhy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlcGZuZnNmYXNrZHh2bmt2dmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODY5OTQsImV4cCI6MjEwMzg2Mjk5NH0.S5sahzZ4SlOjrul7VXSqk6GETqxXzk3MGXpwsgrAC9Y";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);