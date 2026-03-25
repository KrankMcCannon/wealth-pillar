/**
 * Punto unico per TanStack Virtual nel progetto.
 *
 * `useVirtualizer` espone API imperative (misura, scroll) che il React Compiler
 * non memoizza in modo sicuro; centralizzando l’import qui si evita di ripetere
 * workaround e si documenta il vincolo in un solo file.
 *
 * @see https://tanstack.com/virtual/latest
 */
export { useVirtualizer } from '@tanstack/react-virtual';
