/**
 * Example component test demonstrating the testing infrastructure
 * This file shows how to use the testing utilities and patterns
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { createMockAssessment } from '../utils/test-helpers';
import { assessmentResponseFixtures } from '../fixtures/assessment-data';

// Example: Testing a UI component
describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Styled button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});

// Example: Testing with mock data
describe('Assessment Data Helpers', () => {
  it('should create valid mock assessment data', () => {
    const mockAssessment = createMockAssessment({
      scoreCategory: 'leader',
      totalScore: 78,
    });

    expect(mockAssessment).toHaveProperty('id');
    expect(mockAssessment).toHaveProperty('sessionId');
    expect(mockAssessment.scoreCategory).toBe('leader');
    expect(mockAssessment.totalScore).toBe(78);
    expect(mockAssessment.scoreBreakdown).toHaveProperty('valueAssurance');
    expect(mockAssessment.scoreBreakdown).toHaveProperty('customerSafe');
    expect(mockAssessment.scoreBreakdown).toHaveProperty('riskCompliance');
    expect(mockAssessment.scoreBreakdown).toHaveProperty('governance');
  });

  it('should use fixture data for consistent testing', () => {
    const leaderResponses = assessmentResponseFixtures.leader;

    expect(leaderResponses.value_assurance_1).toBe('A');
    expect(leaderResponses.customer_safe_1).toBe('A');
    expect(leaderResponses.risk_compliance_1).toBe('B');
    expect(leaderResponses.governance_1).toBe('A');
  });

  it('should validate object structure with helper', () => {
    const mockAssessment = createMockAssessment();

    // Validate basic structure
    expect(mockAssessment).toHaveProperty('id');
    expect(mockAssessment).toHaveProperty('sessionId');
    expect(mockAssessment).toHaveProperty('totalScore');
    expect(mockAssessment).toHaveProperty('scoreCategory');
    expect(mockAssessment).toHaveProperty('scoreBreakdown');

    expect(typeof mockAssessment.id).toBe('string');
    expect(typeof mockAssessment.sessionId).toBe('string');
    expect(typeof mockAssessment.totalScore).toBe('number');
    expect(['champion', 'builder', 'risk_zone', 'alert', 'crisis']).toContain(
      mockAssessment.scoreCategory
    );

    expect(mockAssessment.scoreBreakdown).toHaveProperty('valueAssurance');
    expect(mockAssessment.scoreBreakdown).toHaveProperty('customerSafe');
    expect(mockAssessment.scoreBreakdown).toHaveProperty('riskCompliance');
    expect(mockAssessment.scoreBreakdown).toHaveProperty('governance');
  });
});

// Example: Async testing with waitFor
describe('Async Operations', () => {
  it('should handle loading states', async () => {
    const AsyncComponent = () => {
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 100);
        return () => clearTimeout(timer);
      }, []);

      return loading ? <div>Loading...</div> : <div>Loaded!</div>;
    };

    render(<AsyncComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Loaded!')).toBeInTheDocument();
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});

// Example: Testing with theme provider (from jest.setup.js)
describe('Theme Integration', () => {
  it('should render with theme provider wrapper', () => {
    // This test uses the custom render function from jest.setup.js
    // which automatically wraps components with ThemeProvider
    render(<Button>Themed button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Just verify the button renders correctly with the theme provider
    expect(button).toHaveTextContent('Themed button');
  });
});

// Example: Error boundary testing
describe('Error Handling', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  it('should handle errors gracefully', () => {
    // Suppress console errors for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ThrowError shouldThrow={true} />);
    }).toThrow('Test error');

    consoleSpy.mockRestore();
  });

  it('should render without errors when stable', () => {
    expect(() => {
      render(<ThrowError shouldThrow={false} />);
    }).not.toThrow();

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
