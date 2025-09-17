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
    endTurn: vi.fn(),
    clearError: vi.fn()
  }))
}));

describe('Player App', () => {
  it('renders the initial join screen', () => {
    render(<App />);
    
    expect(screen.getByText('TCG Connect - Player')).toBeInTheDocument();
    expect(screen.getByText('Join Game')).toBeInTheDocument();
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter game ID')).toBeInTheDocument();
  });

  it('enables join button when both name and game ID are entered', () => {
    render(<App />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const gameIdInput = screen.getByPlaceholderText('Enter game ID');
    const joinButton = screen.getByText('Join Game');
    
    expect(joinButton).toBeDisabled();
    
    fireEvent.change(nameInput, { target: { value: 'Test Player' } });
    expect(joinButton).toBeDisabled();
    
    fireEvent.change(gameIdInput, { target: { value: 'GAME123' } });
    expect(joinButton).not.toBeDisabled();
  });

  it('allows switching between player roles', () => {
    render(<App />);
    
    const player1Button = screen.getByText('Player 1');
    const player2Button = screen.getByText('Player 2');
    
    // Player 1 should be selected by default
    expect(player1Button).toHaveClass('bg-blue-500', 'text-white');
    expect(player2Button).toHaveClass('bg-gray-200', 'text-gray-700');
    
    // Click Player 2
    fireEvent.click(player2Button);
    
    expect(player2Button).toHaveClass('bg-blue-500', 'text-white');
    expect(player1Button).toHaveClass('bg-gray-200', 'text-gray-700');
  });

  it('converts game ID to uppercase', () => {
    render(<App />);
    
    const gameIdInput = screen.getByPlaceholderText('Enter game ID') as HTMLInputElement;
    
    fireEvent.change(gameIdInput, { target: { value: 'game123' } });
    
    expect(gameIdInput.value).toBe('GAME123');
  });

  it('updates input values correctly', () => {
    render(<App />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name') as HTMLInputElement;
    const gameIdInput = screen.getByPlaceholderText('Enter game ID') as HTMLInputElement;
    
    fireEvent.change(nameInput, { target: { value: 'Test Player' } });
    fireEvent.change(gameIdInput, { target: { value: 'GAME123' } });
    
    expect(nameInput.value).toBe('Test Player');
    expect(gameIdInput.value).toBe('GAME123');
  });
});