export function toDataProps(
  props: Record<string, string>
): Record<string, string> {
  return Object.entries(props).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [`data-${key}`]: value,
    }),
    {}
  )
}
