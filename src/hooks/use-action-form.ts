"use client";

import { useActionState, useTransition, type FormEvent } from "react";

/**
 * useActionState for a form, without React's automatic reset.
 *
 * React 19 clears a form's uncontrolled fields after `<form action>` runs,
 * even when the server answered with validation errors, so staff would lose
 * everything they typed. Dispatching from onSubmit inside a transition keeps
 * the fields. Use as `<form onSubmit={submit}>`.
 */
export function useActionForm<State, Payload extends FormData = FormData>(
  action: (
    previous: Awaited<State>,
    payload: Payload,
  ) => State | Promise<State>,
  initialState: Awaited<State>,
) {
  const [state, dispatch, pending] = useActionState(action, initialState);
  const [, startTransition] = useTransition();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = new FormData(event.currentTarget) as Payload;
    startTransition(() => dispatch(payload));
  };
  return [state, submit, pending] as const;
}
