import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/users/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        // Redirect to home after successful password reset
        setTimeout(() => {
          navigate('/'); // Adjust the URL to your home route
        }, 2000); // Redirect after 2 seconds
      } else {
        setMessage('Error resetting password');
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
        <Stack spacing={4}>
          <Heading textAlign="center" fontSize="2xl" color={useColorModeValue('gray.800', 'whiteAlpha.900')}>
            Reset Password
          </Heading>
          <form onSubmit={handleSubmit}>
            <FormControl isRequired>
              <FormLabel color={useColorModeValue('gray.700', 'whiteAlpha.900')}>New Password</FormLabel>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                bg={useColorModeValue('gray.100', '#2D2D2D')}
              />
            </FormControl>
            <Button
              mt={4}
              width="full"
              colorScheme="teal"
              type="submit"
            >
              Reset Password
            </Button>
          </form>
          {message && (
            <Text textAlign="center" color="red.500">
              {message}
            </Text>
          )}
        </Stack>
      </Box>
    </Flex>
  );
};

export default ResetPassword;
