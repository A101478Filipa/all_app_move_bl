import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import DateTimePicker, { useDefaultStyles }  from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';

interface FormDateInputProps {
  title: string;
  value: string;
  onDateChange: (date: string) => void;
  placeholder: string;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

export const FormDateInput: React.FC<FormDateInputProps> = ({
  title,
  value,
  onDateChange,
  placeholder,
  required = false,
  minimumDate,
  maximumDate,
}) => {
  const { t } = useTranslation();
  const defaultStyles = useDefaultStyles();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  // Guardamos a data temporária enquanto o utilizador escolhe no calendário
  const [tempDate, setTempDate] = useState(value ? dayjs(value) : dayjs());

  const showDatePicker = () => {
    // Reseta para a data atual do input ao abrir o calendário
    setTempDate(value ? dayjs(value) : dayjs()); 
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = () => {
    // Formata a data para YYYY-MM-DD antes de enviar para o teu formulário
    const formattedDate = tempDate.format('YYYY-MM-DD');
    onDateChange(formattedDate);
    hideDatePicker();
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { // Usa formato PT para leitura mais amigável
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {title}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* O Input falso onde o utilizador clica para abrir o calendário */}
      <TouchableOpacity style={styles.input} onPress={showDatePicker}>
        <Text style={[
          styles.inputText,
          !value && styles.placeholderText
        ]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {/* Modal Customizado que funciona no Expo em Android e iOS */}
      <Modal
        transparent={true}
        visible={isDatePickerVisible}
        animationType="fade"
        onRequestClose={hideDatePicker}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={hideDatePicker}
        >
          {/* Caixa central do calendáriO */}
          <TouchableOpacity activeOpacity={1} style={styles.calendarContainer}>
            
            <DateTimePicker
              mode="single"
              date={tempDate.toDate()}
              onChange={(params) => setTempDate(dayjs(params.date))}
              minDate={minimumDate}
              maxDate={maximumDate}
              
              // --- A MAGIA DA VERSÃO 2.0+ ACONTECE AQUI ---
              styles={{
                ...defaultStyles, // Carrega o design base bonito
                
                // O círculo de fundo quando clicas num dia:
                selected: { 
                  backgroundColor: '#2A9E9D', 
                  borderRadius: 100 // Garante que fica uma bolinha perfeita
                },
                
                // A cor do texto do dia selecionado (Branco):
                selected_label: { 
                  color: 'white', 
                  fontWeight: 'bold' 
                },
                
                // (Opcional) A borda à volta do dia de hoje:
                today: { 
                  borderColor: '#2A9E9D', 
                  borderWidth: 1, 
                  borderRadius: 100 
                },
              }}
            />

            {/* Botões do Modal */}
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={hideDatePicker} style={styles.button}>
                <Text style={styles.cancelText}>{t('common.cancel') || 'Cancelar'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleConfirm} style={styles.button}>
                <Text style={styles.confirmText}>{t('common.confirm') || 'Confirmar'}</Text>
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    width: '100%',
  },
  label: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: Spacing.xs_4,
  },
  required: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.Error.default,
  },
  input: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    backgroundColor: Color.Background.white,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
  },
  placeholderText: {
    color: Color.Gray.v400,
  },
  
  // --- Estilos do Modal e Calendário ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escuro atrás do pop-up
  },
  calendarContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    // Sombra para dar destaque ao pop-up
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm_8,
    gap: Spacing.md_16,
  },
  button: {
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.sm_8,
  },
  cancelText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
  confirmText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.bold,
    color: '#2A9E9D', // O texto do botão Confirmar com a tua cor principal!
  }
});