/*
 * Copyright 2025 International Digital Economy Academy
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ChangeEvent,
  ChangeEventHandler,
  Dispatch,
  MouseEventHandler,
  MutableRefObject,
  SetStateAction,
  useState
} from 'react'
import styles from './index.module.css'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

/**
 * Represents a validation function that takes a value of type string and returns
 * either a string (representing an error message) or undefined (indicating that
 * the value is valid).
 *
 * @param value - The value to be validated.
 * @returns Either a string (representing an error message) or undefined.
 */
type Validate = (
  value: string
) => string | undefined | Promise<string | undefined>

type FormInputProps = {
  title: string
  validate: Validate
  value: string
  setValue: Dispatch<SetStateAction<string>>
  error: string | undefined
  setError: Dispatch<SetStateAction<string | undefined>>
}

export const validateEmail: Validate = (value) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

  if (value.toLowerCase().match(re)) {
    return undefined
  } else {
    return 'Invalid e-mail address'
  }
}
export const validatePassword: Validate = (value) => {
  let ok = false
  if (value.length > 48) {
    return 'Password is too long'
  }
  if (value.length > 15) {
    ok = true
  }
  if (value.length > 8) {
    let hasNumber = false
    let hasLowercase = false
    for (const c of value) {
      if (c.match(/[0-9]/)) {
        hasNumber = true
      }
      if (c.match(/[a-z]/)) {
        hasLowercase = true
      }
    }
    if (hasNumber && hasLowercase) {
      ok = true
    }
  }
  return ok
    ? undefined
    : 'Password must be at least 15 characters OR at least 8 characters including a number and a lowercase letter'
}
export const validateUsername: Validate = (value) => {
  if (value.length < 5 || value.length > 39) {
    return 'Username must be between 5 and 39 characters long'
  }
  for (const char of value) {
    if (!(char.match(/[a-zA-Z0-9]/) || char === '-' || char === '_')) {
      return 'Usernames can only contain alphanumeric characters, dashes (-), and underscores (_).'
    }
  }
  return undefined
}

export function VerificationCode(
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > &
    FormInputProps & {
      email: string
      emailError: string | undefined
    }
) {
  const {
    title,
    validate,
    value,
    setValue,
    error,
    setError,
    email,
    emailError,
    ...inputProps
  } = props
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const mooncakesApi = customFields?.MOONCAKES_API as string
  const [doesSent, setDoesSent] = useState(false)
  const message = doesSent ? 'verification code sent' : 'send verification code'
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value)
    setError(undefined)
  }
  const handleClick: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault()
    if (email === '') {
      setError('Email is required')
      return
    }
    if (emailError !== undefined) {
      setError('Invalid Email')
      return
    }
    setError(undefined)
    try {
      const params = new URLSearchParams()
      params.set('email', email)
      const res = await fetch(
        `${mooncakesApi}/generate_email_verify_code?${params}`,
        {
          headers: {
            accept: 'application/json'
          },
          body: null,
          method: 'POST',
          mode: 'cors'
        }
      )
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500) {
          const json = (await res.json()) as { detail: string }
          throw new Error(json.detail)
        }
      }
      setDoesSent(true)
    } catch (e) {
      if (e instanceof Error) {
        setDoesSent(false)
        setError(e.message)
      }
    }
  }
  return (
    <div className={styles['input-wrapper']}>
      <div className={styles['verification-code-title-wrapper']}>
        <p className={styles['verification-code-title']}>{title}</p>
        <button
          className={styles['verification-code-button']}
          disabled={doesSent}
          onClick={handleClick}
        >
          {message}
        </button>
      </div>
      <input
        className={styles['input-input']}
        style={{
          outlineColor: error !== undefined ? 'var(--ifm-color-danger)' : ''
        }}
        spellCheck='false'
        onChange={handleChange}
        value={value}
        {...inputProps}
      />
      {error !== undefined && (
        <p className={styles['validation-error']}>{error}</p>
      )}
    </div>
  )
}

export default function FormInput(
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > &
    FormInputProps
) {
  const { title, validate, value, setValue, error, setError, ...inputProps } =
    props
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue(value)
    setError(await validate(value))
  }
  return (
    <div className={styles['input-wrapper']}>
      <p className={styles['input-title']}>{title}</p>
      <input
        className={styles['input-input']}
        style={{
          outlineColor: error !== undefined ? 'var(--ifm-color-danger)' : ''
        }}
        spellCheck='false'
        onChange={handleChange}
        value={value}
        {...inputProps}
      />
      {error !== undefined && (
        <p className={styles['validation-error']}>{error}</p>
      )}
    </div>
  )
}
