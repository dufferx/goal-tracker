import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './app';

describe('App', () => {
  it('renders the repository foundation screen', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Goal Tracker' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Foundation ready' })).toBeInTheDocument();
  });
});
