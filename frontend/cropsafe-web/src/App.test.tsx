import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element, path }: { element: React.ReactElement; path: string }) => (
    path === '/' ? element : null
  ),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
}), { virtual: true });

test('renders CropSafe home page', () => {
  render(<App />);
  expect(screen.getByText(/Welcome to CropSafe/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Detect Disease/i })).toBeInTheDocument();
});
