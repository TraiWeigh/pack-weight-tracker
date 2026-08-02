import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';

interface MailingListModalProps {
  userId: string;
  onDismiss: () => void;
}

const getMailingKey = (userId: string) => `trail-weigh-mailing-${userId}`;

export function hasSeenMailingPrompt(userId: string): boolean {
  return localStorage.getItem(getMailingKey(userId)) !== null;
}

export function MailingListModal({ userId, onDismiss }: MailingListModalProps) {
  const [subscribing, setSubscribing] = useState(false);

  const handleYes = () => {
    setSubscribing(true);
    localStorage.setItem(getMailingKey(userId), 'subscribed');
    setTimeout(onDismiss, 400);
  };

  const handleNo = () => {
    localStorage.setItem(getMailingKey(userId), 'declined');
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-card border border-card-border rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Mail className="w-5 h-5" />
          </div>
          <button
            onClick={handleNo}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="font-bold text-foreground text-lg mb-2">Stay in the loop?</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Get occasional updates about new TrailWeigh features, tips, and ultralight gear news. No spam — unsubscribe anytime.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleYes}
            disabled={subscribing}
            className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {subscribing ? 'Subscribed ✓' : "Yes, sign me up"}
          </button>
          <button
            onClick={handleNo}
            className="flex-1 bg-muted text-muted-foreground font-semibold py-2.5 rounded-lg text-sm hover:bg-muted/80 transition-colors"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
