import React from 'react';
import { PendingRecruit } from '../../../types';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from '../../Button';

interface RecruitModalProps {
  recruit: PendingRecruit;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const RecruitModal: React.FC<RecruitModalProps> = ({ recruit, onConfirm, onCancel, loading }) => {
  return (
    <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-sm w-full border border-green-700 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-green-400 flex items-center">
                    <UserPlusIcon className="h-6 w-6 mr-2"/> Recruit
                </h2>
                <button onClick={onCancel}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            
            <div className="text-center space-y-4">
                <p className="text-slate-300">
                    <strong className="text-white block text-xl mb-1">{recruit.name}</strong>
                    wants to join your party!
                </p>
                <div className="bg-slate-800 p-2 rounded text-xs text-slate-400">
                    Estimated Level: {recruit.level}
                </div>
                <div className="text-sm text-slate-400">
                    Do you accept them into your ranks?
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <Button 
                    variant="ghost" 
                    onClick={onCancel}
                    fullWidth
                    disabled={loading}
                >
                    Decline
                </Button>
                <Button 
                    variant="primary" 
                    onClick={onConfirm}
                    fullWidth
                    disabled={loading}
                    className="bg-green-700 hover:bg-green-600 border-green-500"
                >
                    {loading ? "Accepting..." : "Accept"}
                </Button>
            </div>
        </div>
    </div>
  );
};

export default RecruitModal;