import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../../client/src/components/auth/Login';

describe('Login Page - Integration Tests', () => {
  test('renders login form', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  test('displays error for empty fields on submit', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
  });
});