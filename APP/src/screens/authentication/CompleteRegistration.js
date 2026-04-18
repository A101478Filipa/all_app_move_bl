import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable, TextInput, Platform, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { CommonActions } from '@react-navigation/native';
import { Color } from "@src/styles/colors";
import { FontSize, FontFamily } from "@src/styles/fonts";
import { Border } from "@src/styles/borders";
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@src/stores/authStore';

const CompleteRegistration = ({ route }) => {
  const navigation = useNavigation();
  const { username, email, password } = route.params;
  const { login } = useAuthStore();

  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  //const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const handleCompleteRegistration = () => {
    if (!fullName || !birthDate || !gender || !role || !address || !phone) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill out all fields.',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 60,
      });
      return;
    }

    // Proceed with the registration if validation passes
    registerUser();

    // Perform registration logic here (e.g., send data to backend)
    // Registration success handled with Toast below
    //navigation.navigate("Welcome"); // Navigate to a welcome or login screen
  };

  /*const registerUser = async () => {
    try {
      // Step 2A: Create a new user
      const userResponse = await fetch('http://192.168.1.253:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      });
  
      if (!userResponse.ok) {
        throw new Error('Failed to create user.');
      }
  
      const userData = await userResponse.json();
      const userId = userData.user_id; // Assuming the response contains the new user's ID
  
      // Step 2B: Create the role-specific record
      let roleEndpoint = '';
      let roleData = {};
  
      switch (role) {
        case 'Elderly':
          roleEndpoint = 'elderly';
          roleData = {
            user_id: userId,
            name: fullName,
            birth_date: birthDate.toISOString(),
            gender,
            address,
            phone,
            email,
            created_at: new Date(),
            updated_at: new Date(),
          };
          break;
        case 'Clinician':
          roleEndpoint = 'clinicians';
          roleData = {
            user_id: userId,
            name: fullName,
            phone,
            email,
            institution_id: 1, // Replace with actual institution ID if needed
            created_at: new Date(),
            updated_at: new Date(),
          };
          break;
        case 'Caregiver':
          roleEndpoint = 'caregivers';
          roleData = {
            user_id: userId,
            name: fullName,
            phone,
            email,
            institution_id: 1, // Replace with actual institution ID if needed
            created_at: new Date(),
            updated_at: new Date(),
          };
          break;
        default:
          throw new Error('Invalid role selected.');
      }
  
      const roleResponse = await fetch(`http://192.168.1.253:3000/api/${roleEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });
  
      if (!roleResponse.ok) {
        throw new Error(`Failed to create ${role.toLowerCase()} record.`);
      }
  
      // Success handled with Toast in main function
      navigation.navigate('Login');
  
    } catch (error) {
      // Error handled with Toast in main function
    }
  };*/

  const registerUser = async () => {
    try {

      // Convert role to lowercase to match database constraint
      const formattedRole = role.toLowerCase();

      // Step 1: Create a new user
      const userResponse = await fetch('http://192.168.1.133:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role: formattedRole,  // Use the formatted role
          created_at: new Date(),
          updated_at: new Date(),
        }),
      });
  
      if (!userResponse.ok) {
        throw new Error('Failed to create user.');
      }
  
      const userData = await userResponse.json();
      const userId = userData.user_id; // Adjust if your server response is different

      //console.log("UserID", userId);
      //console.log(role);
  
      // Step 2: Create the role-specific record
      let roleEndpoint = '';
      let roleData = {};
  
      switch (role.toLowerCase()) {
        case 'elderly':
          roleEndpoint = 'elderly';
          roleData = {
            user_id: userId,
            name: fullName,
            birth_date: birthDate.toISOString(),
            //birth_date: birthDate.toISOString().split('T')[0], // Formatting date as YYYY-MM-DD
            gender,
            address,
            phone,
            email,
            institution_id: 1, // Replace with actual institution ID if needed
            created_at: new Date(),
            updated_at: new Date(),
          };
          break;
        case 'clinician':
          roleEndpoint = 'clinicians';
          roleData = {
            user_id: userId,
            name: fullName,
            birth_date: birthDate.toISOString(),
            gender,
            phone,
            email,
            institution_id: 1, // Replace with actual institution ID if needed
            created_at: new Date(),
            updated_at: new Date(),
          };
          break;
        case 'caregiver':
          roleEndpoint = 'caregivers';
          roleData = {
            user_id: userId,
            name: fullName,
            birth_date: birthDate.toISOString(),
            gender,
            phone,
            email,
            institution_id: 1, // Replace with actual institution ID if needed
            created_at: new Date(),
            updated_at: new Date(),
          };
          break;
        default:
          throw new Error('Invalid role selected.');
      }
  
      const roleResponse = await fetch(`http://192.168.1.133:3000/api/register${roleEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });
  
      if (!roleResponse.ok) {
        throw new Error(`Failed to create ${formattedRole.toLowerCase()} record.`);
      }
  
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Registration complete!',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 60,
      });

      // Automatically log in the user after successful registration
      try {
        await login({
          username,
          password
        });
        // Navigation will be handled automatically by the auth flow
      } catch (loginError) {
        console.error('Auto-login error:', loginError);
        // If auto-login fails, redirect to login screen
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      }
  
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 60,
      });
    }
  };
  

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false); // Hide the picker after a date is selected
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.text}>
        <Text style={[styles.CompleteRegisterTitle, styles.RegisterNowTypo]}>
          Complete Registration!
        </Text>
      </View>
      
      <Text style={styles.label}>Name:</Text>
      <View style={styles.inputLayout}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <Text style={styles.label}>Birthday:</Text>
      <View style={styles.datePickerContainer}>
        <DateTimePicker
            value={birthDate}
            mode="date"
            display="calendar"
            onChange={(event, selectedDate) => {
            if (selectedDate) {
            setBirthDate(selectedDate);
            }
        }}
        style={styles.datePicker}
        />
      </View>

      <Text style={styles.label}>Gender:</Text>
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, gender === "Male" && styles.selectedButton]}
          onPress={() => setGender("Male")}
        >
          <Text style={styles.buttonText}>Male</Text>
        </Pressable>
        <Pressable
          style={[styles.button, gender === "Female" && styles.selectedButton]}
          onPress={() => setGender("Female")}
        >
          <Text style={styles.buttonText}>Female</Text>
        </Pressable>
        <Pressable
          style={[styles.button, gender === "Other" && styles.selectedButton]}
          onPress={() => setGender("Other")}
        >
          <Text style={styles.buttonText}>Other</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Role:</Text>
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, role === "Caregiver" && styles.selectedButton]}
          onPress={() => setRole("Caregiver")}
        >
          <Text style={styles.buttonText}>Caregiver</Text>
        </Pressable>
        <Pressable
          style={[styles.button, role === "Clinician" && styles.selectedButton]}
          onPress={() => setRole("Clinician")}
        >
          <Text style={styles.buttonText}>Clinician</Text>
        </Pressable>
        <Pressable
          style={[styles.button, role === "Elderly" && styles.selectedButton]}
          onPress={() => setRole("Elderly")}
        >
          <Text style={styles.buttonText}>Elderly</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Phone Number:</Text>
      <View style={styles.inputLayout}>
        <TextInput
          style={styles.input}
          placeholder=""
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <Text style={styles.label}>Address:</Text>
      <View style={styles.inputLayout}>
        <TextInput
          style={styles.input}
          placeholder=""
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <Pressable style={styles.completeButton} onPress={handleCompleteRegistration}>
        <Text style={styles.completeButtonText}>Complete Registration</Text>
      </Pressable>

      <Pressable
        style={styles.backButton}
        onPress={() => navigation.navigate("Welcome")}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Color.white,
  },
  text: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  CompleteRegisterTitle: {
    fontSize: FontSize.size_11xl,
    letterSpacing: -0.3,
    lineHeight: 39,
    color: Color.dark,
    textAlign: "center",
    fontFamily: FontFamily.urbanistBold,
    fontWeight: "700",
  },
  RegisterNowTypo: {
    fontFamily: FontFamily.urbanistBold,
    fontWeight: "700",
  },
  input: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 10,
    color: Color.gray1,
    fontFamily: FontFamily.urbanistMedium,
    fontSize: FontSize.size_mini,
    borderRadius: Border.br_5xs,
    backgroundColor: Color.colorWhitesmoke,
    borderWidth: 1,
    borderColor: Color.colorAliceblue,
  },
  inputLayout: {
    width: '100%',
    height: 56,
    marginBottom: 15,
    justifyContent: 'center',
    borderRadius: Border.br_5xs,
    backgroundColor: Color.colorWhitesmoke,
  },
  label: {
    fontSize: FontSize.size_mini,
    marginBottom: 5,
    color: Color.dark,
    fontFamily: FontFamily.urbanistMedium,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',  // Aligns content to the left
    alignItems: 'center',  // Vertically aligns items to the center
    marginBottom: 10,  // Adjusts spacing from other components
    //alignItems: 'flex-start',  // Aligns the date picker to the left
    //marginBottom: 15,  // Adjusts spacing from other components
  },
  datePicker: {
    alignSelf: 'flex-start',  // Ensures the date picker is aligned to the left
    width: '35%',  // Ensures the date picker fits within its container
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: Border.br_5xs,
    backgroundColor: Color.colorWhitesmoke,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: Color.primary,
  },
  buttonText: {
    color: Color.gray1,
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.urbanistMedium,
  },
  completeButton: {
    backgroundColor: Color.primary,
    paddingVertical: 15,
    borderRadius: Border.br_5xs,
    alignItems: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    color: Color.white,
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.urbanistExtraBold,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: Color.primary,
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.urbanistMedium,
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 15,
    borderRadius: Border.br_5xs,
    backgroundColor: Color.colorWhitesmoke,
  },
});

export default CompleteRegistration;
