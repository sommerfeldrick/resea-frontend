import React, { useState } from 'react';
import type { TaskPlan } from '../types';

interface PlanEditorProps {
  plan: TaskPlan;
  onSave: (updatedPlan: TaskPlan) => void;
  onCancel: () => void;
}

export const PlanEditor: React.FC<PlanEditorProps> = ({ plan, onSave, onCancel }) => {
  const [editedPlan, setEditedPlan] = useState<TaskPlan>(JSON.parse(JSON.stringify(plan)));

  const handleAddStep = (phase: 'thinking' | 'research' | 'writing') => {
    const newPlan = { ...editedPlan };
    newPlan.executionPlan[phase].push('Nova etapa...');
    setEditedPlan(newPlan);
  };

  const handleRemoveStep = (phase: 'thinking' | 'research' | 'writing', index: number) => {
    const newPlan = { ...editedPlan };
    newPlan.executionPlan[phase].splice(index, 1);
    setEditedPlan(newPlan);
  };

  const handleEditStep = (phase: 'thinking' | 'research' | 'writing', index: number, value: string) => {
    const newPlan = { ...editedPlan };
    newPlan.executionPlan[phase][index] = value;
    setEditedPlan(newPlan);
  };

  const handleMoveStep = (phase: 'thinking' | 'research' | 'writing', index: number, direction: 'up' | 'down') => {
    const newPlan = { ...editedPlan };
    const steps = newPlan.executionPlan[phase];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < steps.length) {
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
      setEditedPlan(newPlan);
    }
  };

  const renderPhaseEditor = (phase: 'thinking' | 'research' | 'writing', title: string, icon: string) => {
    const steps = editedPlan.executionPlan[phase];

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>{icon}</span> {title} ({steps.length} etapas)
        </h3>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-sm font-semibold text-indigo-700">
                {index + 1}
              </div>
              <textarea
                value={step}
                onChange={(e) => handleEditStep(phase, index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={2}
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveStep(phase, index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-600 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mover para cima"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveStep(phase, index, 'down')}
                  disabled={index === steps.length - 1}
                  className="p-1 text-gray-600 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mover para baixo"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemoveStep(phase, index)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Remover"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => handleAddStep(phase)}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors text-sm font-medium"
          >
            + Adicionar etapa
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Plano de Execução
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Basic Info */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
            <input
              type="text"
              value={editedPlan.taskTitle}
              onChange={(e) => setEditedPlan({ ...editedPlan, taskTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
              <input
                type="text"
                value={editedPlan.taskDescription.type}
                onChange={(e) => setEditedPlan({
                  ...editedPlan,
                  taskDescription: { ...editedPlan.taskDescription, type: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Público</label>
              <input
                type="text"
                value={editedPlan.taskDescription.audience}
                onChange={(e) => setEditedPlan({
                  ...editedPlan,
                  taskDescription: { ...editedPlan.taskDescription, audience: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Phases */}
          {renderPhaseEditor('thinking', 'Pensamento', '🤔')}
          {renderPhaseEditor('research', 'Pesquisa', '🔍')}
          {renderPhaseEditor('writing', 'Redação', '✍️')}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setEditedPlan(JSON.parse(JSON.stringify(plan)))}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            🔄 Resetar
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(editedPlan)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              ✓ Salvar e Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
