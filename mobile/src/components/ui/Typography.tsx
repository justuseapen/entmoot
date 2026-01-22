import React from "react";
import { Text, StyleSheet, TextStyle, TextProps } from "react-native";
import { COLORS } from "@/theme/colors";

export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodySmall"
  | "caption"
  | "label";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle["textAlign"];
  children: React.ReactNode;
}

export function Typography({
  variant = "body",
  color,
  align,
  style,
  children,
  ...rest
}: TypographyProps) {
  const variantStyle = styles[variant];
  const colorStyle = color ? { color } : {};
  const alignStyle = align ? { textAlign: align } : {};

  return (
    <Text style={[variantStyle, colorStyle, alignStyle, style]} {...rest}>
      {children}
    </Text>
  );
}

// Convenience components for common use cases
export function H1(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="h1" {...props} />;
}

export function H2(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="h2" {...props} />;
}

export function H3(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="h3" {...props} />;
}

export function Body(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="body" {...props} />;
}

export function Caption(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="caption" {...props} />;
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
    color: COLORS.text,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    color: COLORS.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    color: COLORS.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: COLORS.text,
  },
});
