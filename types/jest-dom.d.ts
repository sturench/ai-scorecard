/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveClass(className: string): R;
      toBeDisabled(): R;
      toBeVisible(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveFocus(): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveValue(value: string | number | string[]): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveFormValues(values: Record<string, any>): R;
      toHaveErrorMessage(text?: string | RegExp): R;
      toHaveDescription(text?: string | RegExp): R;
      toHaveAccessibleName(name?: string | RegExp): R;
      toHaveAccessibleDescription(description?: string | RegExp): R;
    }
  }
}

export {};
