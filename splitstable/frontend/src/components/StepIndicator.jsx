import React from "react";
import { Check } from "lucide-react";

const LABELS = ["Connect", "Group", "Expenses", "Settle"];

export default function StepIndicator({ current }) {
  return (
    <div className="steps">
      {LABELS.map((label, i) => {
        const stepNum = i + 1;
        const state = stepNum < current ? "done" : stepNum === current ? "active" : "";
        return (
          <React.Fragment key={label}>
            <div className={`step ${state}`}>
              <span className="step-dot">{state === "done" ? <Check size={12} /> : stepNum}</span>
              {label}
            </div>
            {i < LABELS.length - 1 && <div className="step-line" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
