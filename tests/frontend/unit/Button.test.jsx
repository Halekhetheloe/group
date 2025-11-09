import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../client/src/components/shared/UI/Button';

describe('Button Component - Unit Tests', () => {
  test('renders button with correct text', () => {
    render(<Button label="Click Me" />);
    expect(screen.getByText(/Click Me/i)).toBeInTheDocument();
  });

  test('handles click events', () => {
    const onClick = jest.fn();
    render(<Button label="Click" onClick={onClick} />);
    fireEvent.click(screen.getByText(/Click/i));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});