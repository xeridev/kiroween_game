import { useState } from "react";
import type { Archetype } from "./types";
import "./CreationScreen.css";

interface CreationScreenProps {
  onComplete: (name: string, archetype: Archetype, color: number) => void;
}

const ARCHETYPES: { type: Archetype; description: string }[] = [
  {
    type: "GLOOM",
    description: "A melancholic presence that pulses with sorrow",
  },
  {
    type: "SPARK",
    description: "An erratic entity that jitters with chaotic energy",
  },
  {
    type: "ECHO",
    description: "A fading whisper that phases in and out of reality",
  },
];

export default function CreationScreen({ onComplete }: CreationScreenProps) {
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [color, setColor] = useState("#6b4c9a");
  const [errors, setErrors] = useState<{ name?: string; archetype?: string }>(
    {}
  );

  const validateName = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setErrors((prev) => ({ ...prev, name: "Name is required" }));
      return false;
    }
    if (trimmed.length > 50) {
      setErrors((prev) => ({
        ...prev,
        name: "Name must be 50 characters or less",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, name: undefined }));
    return true;
  };

  const validateArchetype = (): boolean => {
    if (!archetype) {
      setErrors((prev) => ({
        ...prev,
        archetype: "Please select an archetype",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, archetype: undefined }));
    return true;
  };

  const validateColor = (value: string): boolean => {
    // Check if it's a valid hex color format
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isNameValid = validateName(name);
    const isArchetypeValid = validateArchetype();
    const isColorValid = validateColor(color);

    if (isNameValid && isArchetypeValid && isColorValid && archetype) {
      // Convert hex string to number
      const colorNumber = parseInt(color.replace("#", ""), 16);
      onComplete(name.trim(), archetype, colorNumber);
    }
  };

  return (
    <div className="creation-screen" role="main">
      <div className="creation-container">
        <h1 className="creation-title">Summon Your Companion</h1>
        <p className="creation-subtitle">
          What emerges from the void is yours to shape... for now.
        </p>

        <form
          onSubmit={handleSubmit}
          className="creation-form"
          aria-label="Pet creation form"
        >
          {/* Name Input */}
          <div className="form-group">
            <label htmlFor="pet-name" className="form-label">
              Name
            </label>
            <input
              id="pet-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) validateName(e.target.value);
              }}
              onBlur={() => validateName(name)}
              placeholder="Enter a name..."
              className={`form-input ${errors.name ? "input-error" : ""}`}
              maxLength={51}
            />
            {errors.name && (
              <span className="error-message" role="alert" aria-live="polite">
                {errors.name}
              </span>
            )}
          </div>

          {/* Archetype Selection */}
          <div
            className="form-group"
            role="group"
            aria-labelledby="archetype-label"
          >
            <label id="archetype-label" className="form-label">
              Archetype
            </label>
            <div className="archetype-buttons">
              {ARCHETYPES.map((arch) => (
                <button
                  key={arch.type}
                  type="button"
                  onClick={() => {
                    setArchetype(arch.type);
                    setErrors((prev) => ({ ...prev, archetype: undefined }));
                  }}
                  className={`archetype-button ${
                    archetype === arch.type ? "archetype-selected" : ""
                  }`}
                  aria-pressed={archetype === arch.type}
                  aria-label={`${arch.type}: ${arch.description}`}
                >
                  <span className="archetype-name" aria-hidden="true">
                    {arch.type}
                  </span>
                  <span className="archetype-description" aria-hidden="true">
                    {arch.description}
                  </span>
                </button>
              ))}
            </div>
            {errors.archetype && (
              <span className="error-message" role="alert">
                {errors.archetype}
              </span>
            )}
          </div>

          {/* Color Picker */}
          <div className="form-group">
            <label htmlFor="pet-color" className="form-label">
              Color
            </label>
            <div className="color-picker-container">
              <input
                id="pet-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-input"
              />
              <span className="color-value">{color.toUpperCase()}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            aria-label="Begin game with selected pet"
          >
            Begin
          </button>
        </form>
      </div>
    </div>
  );
}
