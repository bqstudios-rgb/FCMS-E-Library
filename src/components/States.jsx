import { Loader2, AlertCircle, FileQuestion } from 'lucide-react';

export const LoadingState = () => (
  <div className="state"><Loader2 className="spin" /><p>Loading...</p></div>
);
export const ErrorState = ({ message }) => (
  <div className="state err"><AlertCircle /><p>{message || 'Something went wrong.'}</p></div>
);
export const EmptyState = ({ message }) => (
  <div className="state"><FileQuestion /><p>{message || 'Nothing here yet.'}</p></div>
);
