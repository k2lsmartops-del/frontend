import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FormInput from './FormInput'

describe('FormInput', () => {
  it('should render label and input', () => {
    render(
      <FormInput
        label="Test Label"
        value=""
        onChange={() => {}}
      />
    )

    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should render with placeholder', () => {
    render(
      <FormInput
        label="Test Label"
        value=""
        onChange={() => {}}
        placeholder="Enter text"
      />
    )

    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('should render with type password', () => {
    const { container } = render(
      <FormInput
        label="Password"
        value=""
        onChange={() => {}}
        type="password"
      />
    )

    const input = container.querySelector('input[type="password"]')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('should call onChange when input value changes', () => {
    const handleChange = vi.fn()
    render(
      <FormInput
        label="Test Label"
        value=""
        onChange={handleChange}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })

    expect(handleChange).toHaveBeenCalledWith('test value')
  })

  it('should display current value', () => {
    render(
      <FormInput
        label="Test Label"
        value="current value"
        onChange={() => {}}
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('current value')
  })
})
