import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-gray-50 px-6">
          <Text className="mb-2 text-4xl">⚠️</Text>
          <Text className="mb-2 text-center text-2xl font-bold text-gray-900">
            Something went wrong
          </Text>
          <Text className="mb-6 text-center text-base text-gray-500">
            An unexpected error occurred. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <View className="mb-6 w-full rounded-lg bg-red-50 p-4">
              <Text className="text-sm text-red-700">
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={this.handleReset}
            className="rounded-xl bg-blue-600 px-8 py-3"
          >
            <Text className="text-base font-semibold text-white">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
