import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock the useSocket hook
vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(() => ({
    connected: false,
    players: [],
    gameState: null,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinGame: vi.fn(),
    leaveGame: vi.fn(),
    performAction: vi.fn(),
    clearError: vi.fn()
  }))
}));

describe('Host App', () => {
  it('renders the initial join screen', () => {
    render(<App />);
    
    expect(screen.getByText('TCG Connect - Host')).toBeInTheDocument();
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
    expect(screen.getByText('Join')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Game ID')).toBeInTheDocument();
  });

  it('enables create game button when name is entered', () => {
    render(<App />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const createButton = screen.getByText('Create New Game');
    
    expect(createButton).toBeDisabled();
    
    fireEvent.change(nameInput, { target: { value: 'Test Host' } });
    
    expect(createButton).not.toBeDisabled();
  });

  it('enables join button when both name and game ID are entered', () => {
    render(<App />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const gameIdInput = screen.getByPlaceholderText('Game ID');
    const joinButton = screen.getByText('Join');
    
    expect(joinButton).toBeDisabled();
    
    fireEvent.change(nameInput, { target: { value: 'Test Host' } });
    expect(joinButton).toBeDisabled();
    
    fireEvent.change(gameIdInput, { target: { value: 'GAME123' } });
    expect(joinButton).not.toBeDisabled();
  });

  it('updates input values correctly', () => {
    render(<App />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name') as HTMLInputElement;
    const gameIdInput = screen.getByPlaceholderText('Game ID') as HTMLInputElement;
    
    fireEvent.change(nameInput, { target: { value: 'Test Host' } });
    fireEvent.change(gameIdInput, { target: { value: 'GAME123' } });
    
    expect(nameInput.value).toBe('Test Host');
    expect(gameIdInput.value).toBe('GAME123');
  });
});