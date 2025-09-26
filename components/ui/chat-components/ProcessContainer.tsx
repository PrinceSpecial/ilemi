import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Loader2, MapPin, FileText, BarChart3 } from 'lucide-react';

export interface ProcessContainerProps {
  status: 'idle' | 'extracting' | 'comparing' | 'generating_report' | 'done';
}

interface StepProps {
  label: string;
  isActive: boolean;
  isDone: boolean;
  icon: React.ReactNode;
}

function Step({ label, isActive, isDone, icon }: StepProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
        isDone
          ? 'bg-green-500 border-green-500 text-white'
          : isActive
            ? 'border-blue-500 text-blue-500'
            : 'border-gray-300 text-gray-400 bg-white dark:bg-gray-800'
      }`}>
        {isDone ? (
          <CheckCircle className="w-6 h-6" />
        ) : isActive ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-6 h-6" />
          </motion.div>
        ) : (
          icon
        )}
      </div>
      <span className={`text-sm font-medium text-center max-w-24 ${
        isDone
          ? 'text-green-600 dark:text-green-400'
          : isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400'
      }`}>
        {label}
      </span>
    </div>
  );
}

interface PathProps {
  isAnimated: boolean;
  isDone: boolean;
}

function Path({ isAnimated, isDone }: PathProps) {
  return (
    <div className="flex items-center px-4">
      <div className="relative w-16 h-0.5 bg-gray-300 dark:bg-gray-600">
        {isAnimated && (
          <motion.div
            className="absolute top-0 left-0 h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        )}
        {isDone && !isAnimated && (
          <div className="absolute top-0 left-0 w-full h-full bg-green-500" />
        )}
      </div>
    </div>
  );
}

export function ProcessContainer({ status }: ProcessContainerProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'extracting':
        return 'Extraction des coordonnées en cours...';
      case 'comparing':
        return 'Comparaison avec les données géospatiales...';
      case 'generating_report':
        return 'Génération du rapport d\'analyse...';
      case 'done':
        return 'Analyse terminée !';
      default:
        return 'Prêt à analyser votre document';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Analyse de votre parcelle
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {getStatusDisplay()}
        </p>
      </div>

      <div className="flex items-center justify-center">
        <Step
          label="Extraction des coordonnées"
          isActive={status === 'extracting'}
          isDone={['comparing', 'generating_report', 'done'].includes(status)}
          icon={<FileText className="w-5 h-5" />}
        />

        <Path
          isAnimated={status === 'comparing'}
          isDone={['generating_report', 'done'].includes(status)}
        />

        <Step
          label="Comparaison des coordonnées"
          isActive={status === 'comparing'}
          isDone={['generating_report', 'done'].includes(status)}
          icon={<MapPin className="w-5 h-5" />}
        />

        <Path
          isAnimated={status === 'generating_report'}
          isDone={status === 'done'}
        />

        <Step
          label="Génération du rapport"
          isActive={status === 'generating_report'}
          isDone={status === 'done'}
          icon={<BarChart3 className="w-5 h-5" />}
        />
      </div>

      {status === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
        >
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Votre analyse est prête !
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}