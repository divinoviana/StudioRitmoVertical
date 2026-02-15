
import React, { useState } from 'react';
import { Class, Student, AttendanceRecord } from '../types';

interface ClassDetailsProps {
  activeClass: Class;
  students: Student[];
  attendance: AttendanceRecord[];
  onBack: () => void;
  onAddStudent: (name: string, classId: string) => void;
  onDeleteStudent: (id: string) => void;
  onToggleAttendance: (studentId: string, classId: string, date: string) => void;
}

const ClassDetails: React.FC<ClassDetailsProps> = ({
  activeClass, students, attendance, onBack, onAddStudent, onDeleteStudent, onToggleAttendance
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'attendance' | 'students'>('attendance');
  const [name, setName] = useState('');

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="text-slate-500 mb-6 flex items-center gap-2 font-bold hover:text-indigo-600 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Voltar para minhas turmas
      </button>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{activeClass.name}</h1>
            <div className="flex items-center gap-3 mt-2">
               <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                 {activeClass.startTime.substring(0,5)} às {activeClass.endTime.substring(0,5)}
               </span>
               <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{activeClass.description}</span>
            </div>
          </div>
          <div className="bg-slate-200 p-1 rounded-2xl flex">
            <button 
              onClick={() => setView('attendance')} 
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${view === 'attendance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Frequência
            </button>
            <button 
              onClick={() => setView('students')} 
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${view === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Lista de Alunos
            </button>
          </div>
        </div>

        <div className="p-8">
          {view === 'attendance' ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data da Chamada</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                  />
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600">{students.length}</span>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos Matriculados</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-slate-400 font-medium">Nenhum aluno matriculado nesta turma ainda.</div>
                ) : (
                  students.map(s => {
                    const present = attendance.some(a => a.studentId === s.id && a.classId === activeClass.id && a.date === date);
                    return (
                      <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors">
                        <div>
                           <span className="font-bold text-slate-800 text-lg">{s.name}</span>
                        </div>
                        <button 
                          onClick={() => onToggleAttendance(s.id, activeClass.id, date)}
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${present ? 'bg-green-500 text-white rotate-0' : 'bg-white text-slate-200 hover:text-slate-300'}`}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-indigo-50 p-6 rounded-[24px]">
                <h3 className="font-black text-indigo-900 mb-4">Matricular Novo Aluno</h3>
                <form onSubmit={e => { e.preventDefault(); if(name) { onAddStudent(name, activeClass.id); setName(''); } }} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Nome completo do aluno" 
                    className="flex-1 border-0 p-4 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <button type="submit" className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors active:scale-95">
                    Adicionar Aluno
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(s => (
                  <div key={s.id} className="bg-white border border-slate-100 p-5 rounded-2xl flex justify-between items-center group hover:border-red-100 transition-all">
                    <span className="font-bold text-slate-700">{s.name}</span>
                    <button 
                      onClick={() => onDeleteStudent(s.id)} 
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
