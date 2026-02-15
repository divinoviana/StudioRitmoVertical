
import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Class, Student, AttendanceRecord } from './types';
import TeacherDashboard from './components/TeacherDashboard';
import ClassDetails from './components/ClassDetails';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<{ student_id: string, class_id: string }[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) await fetchTeacherProfile(session.user.id);
      else setLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchTeacherProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setClasses([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTeacherProfile = async (userId: string) => {
    setLoading(true);
    try {
      // Tentativa de buscar o perfil (pode levar 1s para o trigger do banco terminar)
      let { data, error } = await supabase.from('teachers').select('*').eq('id', userId).single();
      
      // Retry simples caso o trigger ainda esteja processando
      if (!data) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const retry = await supabase.from('teachers').select('*').eq('id', userId).single();
        data = retry.data;
      }

      if (data) {
        setCurrentUser(data);
        await fetchData(userId);
      } else {
        console.error("Perfil do professor não encontrado no banco.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (userId: string) => {
    const [classesRes, studentsRes, enrollRes, attendanceRes] = await Promise.all([
      supabase.from('classes').select('*').eq('teacher_id', userId),
      supabase.from('students').select('*').eq('teacher_id', userId),
      supabase.from('student_classes').select('*'),
      supabase.from('attendance').select('*')
    ]);

    if (classesRes.data) setClasses(classesRes.data.map(c => ({
      id: c.id, teacherId: c.teacher_id, name: c.name, scheduleDays: c.schedule_days,
      startTime: c.start_time, endTime: c.end_time, description: c.description
    })));

    if (studentsRes.data) setStudents(studentsRes.data.map(s => ({
      id: s.id, teacherId: s.teacher_id, name: s.name, active: s.active
    })));

    if (enrollRes.data) setEnrollments(enrollRes.data);

    if (attendanceRes.data) setAttendance(attendanceRes.data.map(a => ({
      id: a.id, studentId: a.student_id, classId: a.class_id, date: a.attendance_date, present: a.present
    })));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email') as string,
      password: fd.get('password') as string,
    });
    if (error) { alert("Erro ao entrar: " + error.message); setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = fd.get('email') as string;
    const name = fd.get('name') as string;
    
    const { error } = await supabase.auth.signUp({
      email,
      password: fd.get('password') as string,
      options: { data: { name } }
    });
    
    if (error) { alert(error.message); setLoading(false); }
    else { 
      alert('Conta criada com sucesso! Redirecionando para login...'); 
      setIsRegistering(false); 
      setLoading(false); 
    }
  };

  const handleAddStudentToClass = async (name: string, classId: string) => {
    if (!currentUser) return;
    const { data: student } = await supabase.from('students')
      .insert([{ name, teacher_id: currentUser.id }]).select().single();

    if (student) {
      await supabase.from('student_classes').insert([{ student_id: student.id, class_id: classId }]);
      setStudents([...students, { id: student.id, teacherId: student.teacher_id, name: student.name, active: student.active }]);
      setEnrollments([...enrollments, { student_id: student.id, class_id: classId }]);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Excluir este aluno?')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) setStudents(students.filter(s => s.id !== id));
  };

  const handleToggleAttendance = async (studentId: string, classId: string, date: string) => {
    const existing = attendance.find(a => a.studentId === studentId && a.classId === classId && a.date === date);
    if (existing) {
      await supabase.from('attendance').delete().eq('id', existing.id);
      setAttendance(attendance.filter(a => a.id !== existing.id));
    } else {
      const { data } = await supabase.from('attendance')
        .insert([{ student_id: studentId, class_id: classId, attendance_date: date, present: true }]).select().single();
      if (data) setAttendance([...attendance, { id: data.id, studentId: data.student_id, classId: data.class_id, date: data.attendance_date, present: data.present }]);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-indigo-900 text-white font-bold animate-pulse">Iniciando Studio Ritmo Vertical...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-900 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
             <h1 className="text-2xl font-black text-indigo-900">RITMO VERTICAL</h1>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Área do Professor</p>
          </div>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <input name="name" required placeholder="Seu Nome Completo" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
            )}
            <input name="email" type="email" required placeholder="E-mail (Ex: adriano@ritmovertical.com)" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
            <input name="password" type="password" required placeholder="Sua Senha" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" />
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
              {isRegistering ? 'Criar minha conta' : 'Acessar meu Painel'}
            </button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-sm text-indigo-600 font-bold">
            {isRegistering ? 'Já sou cadastrado' : 'Primeiro acesso? Registre-se'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveClassId(null)}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">R</div>
          <div className="font-black text-indigo-900 text-lg">RITMO VERTICAL</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 leading-none">{currentUser?.name}</div>
            <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{currentUser?.modality}</div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-slate-400 hover:text-red-500">
            Sair
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-10">
        {!activeClassId ? (
          <TeacherDashboard teacher={currentUser!} classes={classes} onSelectClass={setActiveClassId} />
        ) : (
          <ClassDetails
            activeClass={classes.find(c => c.id === activeClassId)!}
            students={students.filter(s => enrollments.some(e => e.student_id === s.id && e.class_id === activeClassId))}
            attendance={attendance}
            onBack={() => setActiveClassId(null)}
            onAddStudent={handleAddStudentToClass}
            onDeleteStudent={handleDeleteStudent}
            onToggleAttendance={handleToggleAttendance}
          />
        )}
      </main>
    </div>
  );
};

export default App;
