import api from './client'
import type { ContactResponse, ContactPage } from '../types/api'

export const getContacts = () =>
  api.get<ContactPage>('/contacts/').then((r) => r.data)

export const addContact = (contact_id: string) =>
  api.post<ContactResponse>('/contacts/add', { contact_id }).then((r) => r.data)

export const removeContact = (contact_id: string) =>
  api.delete<ContactResponse>(`/contacts/${contact_id}`).then((r) => r.data)
