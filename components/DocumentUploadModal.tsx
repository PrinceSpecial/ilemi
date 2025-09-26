"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onFileUpload,
}: DocumentUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Vérifier que c'est une image (jpeg/png/...)
    if (file.type && file.type.startsWith("image/")) {
      setSelectedFile(file);
    } else {
      alert("Veuillez sélectionner une image (JPEG/PNG).");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
      setSelectedFile(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-opacity-10 backdrop-blur-xs"
        onClick={onClose}
      />          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">
                  Télécharger le relevé topographique
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">
                  Téléversez une image (photo ou scan) contenant les coordonnées de votre parcelle pour lancer l'analyse foncière.
                </p>
                <p className="text-gray-500 text-xs">
                  Formats acceptés : images (JPEG, PNG)
                </p>
              </div>

              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-black bg-gray-50"
                    : selectedFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="w-12 h-12 text-green-600" />
                    <p className="text-sm font-medium text-green-700">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <div>
                      <p className="text-gray-600 mb-1">
                        Glissez-déposez votre image ici
                      </p>
                      <p className="text-gray-500 text-sm mb-3">ou</p>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gray-300"
                      >
                        Parcourir les fichiers
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="flex-1"
                >
                  Analyser la parcelle
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}