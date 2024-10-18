import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userAtom from '../atoms/userAtom';
import { useSetRecoilState } from 'recoil';
import {
  Flex,
  Box,
  Heading,
  Text,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';

const VerifyEmail = () => {
  const { token, email } = useParams(); // Get token and email from the URL
  const setUser = useSetRecoilState(userAtom);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/users/verify-email/${token}/${email}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          
          // Store the entire user object in local storage
          localStorage.setItem('user-threads', JSON.stringify(userData));

          // Set the user state using Recoil
          setUser(userData);

          // Redirect to the home page using navigate
          navigate('/'); // Adjust the URL to your home route
        } else {
          const errorData = await response.json();
          console.error('Error verifying email:', errorData.error);
          // Handle error case (e.g., show a message to the user)
        }
      } catch (error) {
        console.error('Error during fetch:', error);
      }
    };

    verifyEmail(); // Call the verification function
  }, [token, email, setUser, navigate]); // Add navigate to dependencies

  return (
    <Flex align="center" justify="center" height="100vh" bg={useColorModeValue('gray.100', 'gray.800')}>
      <Box
        rounded="lg"
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow="lg"
        p={8}
        width={{ base: '90%', sm: '400px' }}
        textAlign="center"
      >
        <Heading as="h1" size="xl" mb={4}>
          Verifying Your Email
        </Heading>
        <Text mb={4}>
          Please wait while we verify your email address. This may take a few moments.
        </Text>
        <Spinner size="xl" />
      </Box>
    </Flex>
  );
};

export default VerifyEmail;
