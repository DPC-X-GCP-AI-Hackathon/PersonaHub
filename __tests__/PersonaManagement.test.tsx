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

const mockPersonas = [
  {
    id: '1',
    name: 'Dr. Evelyn Reed',
    description: 'A cautious and ethical AI researcher',
    systemPrompt: 'You are Dr. Evelyn Reed...',
    avatar: 'https://i.pravatar.cc/150?u=1'
  },
  {
    id: '2',
    name: 'Jax',
    description: 'A libertarian techno-optimist',
    systemPrompt: 'You are Jax...',
    avatar: 'https://i.pravatar.cc/150?u=2'
  }
];

describe('Persona Management', () => {
  beforeEach(() => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    // Mock fetch API
    global.fetch = jest.fn((url, options) => {
      const method = options?.method || 'GET';

      if (url === 'http://localhost:3001/api/personas' && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([...mockPersonas]),
        });
      }

      if (url === 'http://localhost:3001/api/personas' && method === 'POST') {
        const body = JSON.parse(options.body);
        const newPersona = { ...body, id: '3' };
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(newPersona),
        });
      }

      if (url.startsWith('http://localhost:3001/api/personas/') && method === 'PUT') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(body),
        });
      }

      if (url.startsWith('http://localhost:3001/api/personas/') && method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          status: 204,
        });
      }

      return Promise.reject(new Error('Unknown route'));
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should load and display personas from API', async () => {
    render(<App />);

    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByText('Dr. Evelyn Reed')).toBeInTheDocument();
      expect(screen.getByText('Jax')).toBeInTheDocument();
    });

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/personas');
  });

  test('should create a new persona via API', async () => {
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dr. Evelyn Reed')).toBeInTheDocument();
    });

    // Click the create new persona button
    fireEvent.click(screen.getByText('createNewPersona'));

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('personaNamePlaceholder'), { target: { value: 'Test Persona' } });
    fireEvent.change(screen.getByPlaceholderText('briefDescriptionPlaceholder'), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByPlaceholderText('systemPromptPlaceholder'), { target: { value: 'Test System Prompt' } });

    // Create the persona
    fireEvent.click(screen.getByText('createPersona'));

    // Wait for the modal to close and persona to appear
    await waitFor(() => {
      expect(screen.queryByText('createPersonaTitle')).not.toBeInTheDocument();
    });

    // Check if the new persona is on the screen
    await waitFor(() => {
      expect(screen.getByText('Test Persona')).toBeInTheDocument();
    });
  });

  test('should update an existing persona via API', async () => {
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dr. Evelyn Reed')).toBeInTheDocument();
    });

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
    const nameInput = screen.getByDisplayValue('Dr. Evelyn Reed');
    fireEvent.change(nameInput, { target: { value: 'Dr. Evelyn Reed Updated' } });

    // Update the persona
    fireEvent.click(screen.getByText('updatePersona'));

    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByText('editPersonaTitle')).not.toBeInTheDocument();
    });

    // Check if the updated persona is on the screen
    await waitFor(() => {
      expect(screen.getByText('Dr. Evelyn Reed Updated')).toBeInTheDocument();
    });
  });

  test('should delete a persona via API', async () => {
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dr. Evelyn Reed')).toBeInTheDocument();
    });

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

    // Verify Jax is still there
    expect(screen.getByText('Jax')).toBeInTheDocument();
  });
});
