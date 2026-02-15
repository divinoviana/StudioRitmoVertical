
import React from 'react';
import { Teacher, Class } from '../types';
import { WEEKDAY_LABELS } from '../constants';
import { supabase } from '../supabaseClient';

interface TeacherDashboardProps {
  teacher: Teacher;
  classes: Class[];
  onSelectClass: (id: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacher, classes, onSelectClass }) => {
  
  const createQuickClass = async () => {
    const name = prompt("Nome da Turma (Ex: Turma 01 - Iniciantes):");
    if (!name) return;
    
    const startTime = prompt("Horário de Início (HH:MM):", "18:00");
    const endTime = prompt("Horário de Término (HH:MM):", "19:00");
    
    const { data, error } = await supabase.from('classes').insert([{
      teacher_id: teacher.id,
      name,
      schedule_days: [1, 3], // Padrão: Seg/Qua
      start_time: startTime + ":00",
      end_time: endTime + ":00",
      description: 'Nova turma cadastrada'
    }]).select();

    if (error) alert('Erro ao criar: ' + error.message);
    else window.location.reload();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Suas Turmas</h2>
          <p className="text-slate-500 font-medium">Selecione para gerenciar alunos e chamadas.</p>
        </div>
        <button 
          onClick={createQuickClass}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Adicionar Turma
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[32px]">
            <div className="mb-6 inline-flex p-5 bg-indigo-50 text-indigo-400 rounded-3xl">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Sem turmas por aqui</h3>
            <p className="text-slate-400 max-w-xs mx-auto mb-8 font-medium">Você ainda não possui turmas vinculadas ao seu perfil no banco de dados.</p>
            <button 
              onClick={createQuickClass}
              className="text-indigo-600 font-black hover:text-indigo-700 underline underline-offset-4"
            >
              Criar minha primeira turma agora
            </button>
          </div>
        ) : (
          classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => onSelectClass(cls.id)}
              className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-200 transition-all text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-1.5 mb-6">
                {cls.scheduleDays.map(day => (
                  <span key={day} className="text-[9px] px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-black uppercase tracking-widest">
                    {WEEKDAY_LABELS[day]}
                  </span>
                ))}
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{cls.name}</h3>
              <p className="text-sm text-slate-400 mb-8 font-medium line-clamp-2">{cls.description}</p>
              
              <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-2xl w-fit">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {cls.startTime.substring(0, 5)} - {cls.endTime.substring(0, 5)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
