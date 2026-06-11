import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FormSelect from './FormSelect'

describe('FormSelect', () => {
  it('should render label and select', () => {
    render(
      <FormSelect
        label="Test Label"
        value=""
        onChange={() => {}}
        options={['Option 1', 'Option 2']}
      />
    )

    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should render string options', () => {
    render(
      <FormSelect
        label="Test Label"
        value=""
        onChange={() => {}}
        options={['Option 1', 'Option 2', 'Option 3']}
      />
    )

    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('should render object options', () => {
    const options = [
      { label: 'First', value: '1' },
      { label: 'Second', value: '2' },
    ]
    render(
      <FormSelect
        label="Test Label"
        value=""
        onChange={() => {}}
        options={options}
      />
    )

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('should call onChange when selection changes', () => {
    const handleChange = vi.fn()
    render(
      <FormSelect
        label="Test Label"
        value="Option 1"
        onChange={handleChange}
        options={['Option 1', 'Option 2']}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Option 2' } })

    expect(handleChange).toHaveBeenCalledWith('Option 2')
  })

  it('should display current selected value', () => {
    render(
      <FormSelect
        label="Test Label"
        value="Option 2"
        onChange={() => {}}
        options={['Option 1', 'Option 2']}
      />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('Option 2')
  })
})
