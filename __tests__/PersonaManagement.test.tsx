import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock geminiService
jest.mock('../services/geminiService', () => ({
  createPersonaPrompt: jest.fn().mockResolvedValue('Generated system prompt'),
}));

describe('Persona Management', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  test('should create a new persona and persist it', async () => {
    render(<App />);

    // Click the create new persona button
    fireEvent.click(screen.getByText('createNewPersona'));

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('personaNamePlaceholder'), { target: { value: 'Test Persona' } });
    fireEvent.change(screen.getByPlaceholderText('briefDescriptionPlaceholder'), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByPlaceholderText('systemPromptPlaceholder'), { target: { value: 'Test System Prompt' } });

    // Create the persona
    fireEvent.click(screen.getByText('createPersona'));

    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByText('createPersonaTitle')).not.toBeInTheDocument();
    });

    // Check if the new persona is on the screen
    expect(screen.getByText('Test Persona')).toBeInTheDocument();

    // Check if the persona is in localStorage
    const storedPersonas = JSON.parse(window.localStorage.getItem('personas') || '[]');
    expect(storedPersonas).toHaveLength(3);
    expect(storedPersonas[2].name).toBe('Test Persona');
  });

  test('should edit an existing persona and persist the changes', async () => {
    render(<App />);

    // Find the edit button for the first persona and click it
    const personaCard = screen.getByText('Dr. Evelyn Reed').closest('.group');
    const editButton = personaCard?.querySelector('button'); // First button is edit
    if (editButton) {
        fireEvent.click(editButton);
    }

    // Wait for the modal to open
    await waitFor(() => {
      expect(screen.getByText('editPersonaTitle')).toBeInTheDocument();
    });

    // Change the name
    fireEvent.change(screen.getByDisplayValue('Dr. Evelyn Reed'), { target: { value: 'Dr. Evelyn Reed Updated' } });

    // Update the persona
    fireEvent.click(screen.getByText('updatePersona'));

    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByText('editPersonaTitle')).not.toBeInTheDocument();
    });

    // Check if the updated persona is on the screen
    expect(screen.getByText('Dr. Evelyn Reed Updated')).toBeInTheDocument();

    // Check if the persona is updated in localStorage
    const storedPersonas = JSON.parse(window.localStorage.getItem('personas') || '[]');
    expect(storedPersonas[0].name).toBe('Dr. Evelyn Reed Updated');
  });

  test('should delete a persona and remove it from persistence', async () => {
    render(<App />);

    // Find the delete button for the first persona and click it
    const personaCard = screen.getByText('Dr. Evelyn Reed').closest('.group');
    const deleteButton = personaCard?.querySelectorAll('button')[1]; // Second button is delete
    if (deleteButton) {
        fireEvent.click(deleteButton);
    }

    // Wait for the persona to be removed
    await waitFor(() => {
      expect(screen.queryByText('Dr. Evelyn Reed')).not.toBeInTheDocument();
    });

    // Check if the persona is removed from localStorage
    const storedPersonas = JSON.parse(window.localStorage.getItem('personas') || '[]');
    expect(storedPersonas).toHaveLength(1);
    expect(storedPersonas[0].name).toBe('Jax');
  });
});
