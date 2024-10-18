import React, { useState } from 'react';
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage('Error sending password reset email');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <Flex align="center" justify="center" height="100vh" bg={useColorModeValue('gray.100', '#101010')}>
      <Box
        rounded="lg"
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow="lg"
        p={8}
        width={{ base: '90%', sm: '400px' }}
      >
        <Heading textAlign="center" fontSize="2xl" mb={4} color={useColorModeValue('gray.800', 'whiteAlpha.900')}>
          Forgot Password
        </Heading>
        <Text textAlign="center" mb={6} color={useColorModeValue('gray.600', 'whiteAlpha.800')}>
          Enter your email address to receive a password reset link.
        </Text>
        <form onSubmit={handleSubmit}>
          <FormControl isRequired>
            <FormLabel color={useColorModeValue('gray.700', 'whiteAlpha.900')}>Email Address</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              bg={useColorModeValue('gray.100', '#2D2D2D')}
            />
          </FormControl>
          <Button
            mt={4}
            width="full"
            colorScheme="teal"
            type="submit"
          >
            Send Reset Link
          </Button>
        </form>
        {message && (
          <Text textAlign="center" color="red.500" mt={4}>
            {message}
          </Text>
        )}
      </Box>
    </Flex>
  );
};

export default ForgotPassword;
