import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Dices, Sparkles, Bug, Trophy, Beer, Scroll, Target, Zap } from 'lucide-react';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STEPS = [
    {
        title: "Bem-vindo à Taverna!",
        icon: <Beer className="text-tavern-gold" size={48} />,
        content: "Você acaba de entrar no refúgio dos maiores apostadores do reino. Aqui, fortunas são feitas (e perdidas) em jogos de habilidade e sorte.",
        details: [
            "Use sua Bolsa para gerenciar suas moedas.",
            "Crie mesas locais para jogar com amigos ao seu lado.",
            "Convoque Aventureiros para duelar online via código de sala."
        ]
    },
    {
        title: "Ossos da Taverna",
        icon: <Dices className="text-tavern-gold" size={48} />,
        content: "Um jogo de dados estratégico onde o objetivo é somar mais pontos que o oponente em sua grade 3x3.",
        details: [
            "Dados iguais na mesma coluna multiplicam seu valor (2x, 3x!).",
            "Ao colocar um dado que combine com o do oponente na mesma coluna, você DESTRÓI os dados dele.",
            "O jogo termina quando a grade de alguém estiver cheia."
        ]
    },
    {
        title: "Duelo de Grimórios",
        icon: <Sparkles className="text-purple-400" size={48} />,
        content: "Um duelo rúnico clássico inspirado no Jogo da Velha, mas com o peso de apostas reais.",
        details: [
            "Escolha entre Runas de Fogo ou Gelo.",
            "Alinhe 3 runas na horizontal, vertical ou diagonal para vencer.",
            "O vencedor leva o pote de moedas apostado na criação da mesa."
        ]
    },
    {
        title: "Derby da Carapaça",
        icon: <Bug className="text-emerald-500" size={48} />,
        content: "O caos das corridas de insetos! No Derby, você aposta no seu favorito e torce pelo melhor.",
        details: [
            "Analise os atributos de velocidade e sorte dos insetos.",
            "Quanto menor a torcida em um inseto, maior o Payout (Multiplicador).",
            "Cuidado: Insetos podem dormir no meio da pista ou dar disparadas súbitas!"
        ]
    },
    {
        title: "Honra e Fortuna",
        icon: <Trophy className="text-tavern-gold" size={48} />,
        content: "Pronto para sua primeira rodada? Lembre-se: em caso de empate, as apostas retornam aos jogadores.",
        details: [
            "A Taverna cobra uma pequena taxa de 15% nas corridas.",
            "Duelos 1x1 são de 'vencedor leva tudo'.",
            "Mantenha sua bolsa cheia e sua honra intacta!"
        ]
    }
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-tavern-800 border-2 border-tavern-gold rounded-3xl overflow-hidden shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-500 hover:text-white transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Progress Bar (Side or Top) */}
                    <div className="md:w-1 bg-tavern-900/50 flex flex-row md:flex-col">
                        {STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`flex-1 transition-all duration-500 ${idx <= currentStep ? 'bg-tavern-gold' : 'bg-stone-800'}`}
                            />
                        ))}
                    </div>

                    <div className="flex-1 p-8 md:p-12 flex flex-col items-center text-center">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 p-6 bg-tavern-900 rounded-full border-2 border-tavern-accent/30 shadow-[0_0_50px_rgba(251,191,36,0.1)]"
                        >
                            {step.icon}
                        </motion.div>

                        <h2 className="text-3xl font-serif font-bold text-tavern-parchment mb-4">{step.title}</h2>
                        <p className="text-stone-300 italic mb-8 max-w-md">{step.content}</p>

                        <div className="w-full space-y-3 mb-12">
                            {step.details.map((detail, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-left bg-black/30 p-3 rounded-xl border border-white/5">
                                    <div className="mt-1 text-tavern-gold"><ChevronRight size={14} /></div>
                                    <p className="text-sm text-stone-400">{detail}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto w-full flex justify-between items-center bg-tavern-900/50 p-4 rounded-2xl border border-tavern-accent/10">
                            <button
                                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                                disabled={currentStep === 0}
                                className={`p-2 flex items-center gap-2 font-bold text-sm uppercase tracking-widest transition-opacity ${currentStep === 0 ? 'opacity-0' : 'text-stone-500 hover:text-white'}`}
                            >
                                <ChevronLeft size={20} /> Anterior
                            </button>

                            <div className="text-[10px] text-stone-500 font-mono">
                                {currentStep + 1} / {STEPS.length}
                            </div>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    onClick={() => setCurrentStep(prev => prev + 1)}
                                    className="bg-tavern-gold hover:bg-yellow-600 text-tavern-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                                >
                                    Próximo <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="bg-tavern-accent hover:bg-amber-900 text-white px-8 py-2 rounded-xl font-bold transition-all active:scale-95 border border-tavern-accent"
                                >
                                    Entrar na Taverna
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
