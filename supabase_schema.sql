
-- ==========================================================
-- STUDIO RITMO VERTICAL - DATABASE SCHEMA
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ==========================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS
-- Tabela de Professores (Vinculada ao Auth do Supabase)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    modality TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Turmas
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    schedule_days INTEGER[] NOT NULL, -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Alunos
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Relacionamento Aluno-Turma (Matrícula)
CREATE TABLE IF NOT EXISTS public.student_classes (
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, class_id)
);

-- Tabela de Frequência
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    present BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id, class_id, attendance_date)
);

-- 3. SEGURANÇA (RLS - Row Level Security)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Políticas de isolamento (O professor só acessa o que é dele)
CREATE POLICY "Acesso perfil próprio" ON public.teachers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Gerenciar suas turmas" ON public.classes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Gerenciar seus alunos" ON public.students FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Gerenciar matriculas" ON public.student_classes FOR ALL 
USING (EXISTS (SELECT 1 FROM public.classes WHERE id = student_classes.class_id AND teacher_id = auth.uid()));
CREATE POLICY "Gerenciar frequencia" ON public.attendance FOR ALL 
USING (EXISTS (SELECT 1 FROM public.classes WHERE id = attendance.class_id AND teacher_id = auth.uid()));

-- 4. AUTOMAÇÃO DE PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.teachers (id, name, email, modality)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'Professor'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'modality', 'Geral')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
