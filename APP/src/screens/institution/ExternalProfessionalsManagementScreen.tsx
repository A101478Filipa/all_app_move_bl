import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Modal, TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ExternalProfessional } from 'moveplus-shared';
import { externalProfessionalApi, CreateExternalProfessionalPayload } from '@src/api/endpoints/externalProfessionals';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { useErrorHandler } from '@src/hooks/useErrorHandler';

type FormData = {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  notes: string;
};

const emptyForm = (): FormData => ({
  name: '', specialty: '', phone: '', email: '', notes: '',
});

const ExternalProfessionalsManagementScreen: React.FC = () => {
  const { handleError, handleSuccess } = useErrorHandler();

  const [professionals, setProfessionals] = useState<ExternalProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());

  const fetchProfessionals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await externalProfessionalApi.list();
      setProfessionals(res.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchProfessionals(); }, [fetchProfessionals]));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalVisible(true);
  };

  const openEdit = (p: ExternalProfessional) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      specialty: p.specialty ?? '',
      phone: p.phone ?? '',
      email: p.email ?? '',
      notes: p.notes ?? '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }
    const payload: CreateExternalProfessionalPayload = {
      name: form.name.trim(),
      specialty: form.specialty.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };
    try {
      setSaving(true);
      if (editingId !== null) {
        const res = await externalProfessionalApi.update(editingId, payload);
        setProfessionals(prev => prev.map(p => p.id === editingId ? res.data : p));
        handleSuccess('Profissional atualizado com sucesso');
      } else {
        const res = await externalProfessionalApi.create(payload);
        setProfessionals(prev => [...prev, res.data]);
        handleSuccess('Profissional adicionado com sucesso');
      }
      setModalVisible(false);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: ExternalProfessional) => {
    Alert.alert(
      'Eliminar profissional',
      `Tem a certeza que pretende eliminar "${p.name}"? Os eventos associados ficarão sem profissional externo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await externalProfessionalApi.delete(p.id);
              setProfessionals(prev => prev.filter(x => x.id !== p.id));
              handleSuccess('Profissional eliminado');
            } catch (err) {
              handleError(err);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: ExternalProfessional }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item.name}</Text>
        {!!item.specialty && (
          <Text style={styles.cardDetail}>{item.specialty}</Text>
        )}
        {!!item.phone && (
          <Text style={styles.cardDetail}>
            <MaterialIcons name="phone" size={12} color={Color.Gray.v400} /> {item.phone}
          </Text>
        )}
        {!!item.email && (
          <Text style={styles.cardDetail}>
            <MaterialIcons name="email" size={12} color={Color.Gray.v400} /> {item.email}
          </Text>
        )}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
          <MaterialIcons name="edit" size={20} color={Color.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { marginLeft: Spacing.sm_8 }]} onPress={() => handleDelete(item)} activeOpacity={0.7}>
          <MaterialIcons name="delete-outline" size={20} color={Color.Error.default} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Color.primary} />
        </View>
      ) : (
        <FlatList
          data={professionals}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialIcons name="person-outline" size={48} color={Color.Gray.v300} />
              <Text style={styles.emptyText}>Nenhum profissional externo registado</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
        <MaterialIcons name="add" size={28} color={Color.white} />
      </TouchableOpacity>

      {/* Create / Edit modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId !== null ? 'Editar Profissional' : 'Novo Profissional Externo'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Color.Gray.v500} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={v => setForm(prev => ({ ...prev, name: v }))}
                placeholder="Nome completo"
                placeholderTextColor={Color.Gray.v300}
              />

              <Text style={styles.fieldLabel}>Especialidade / Função</Text>
              <TextInput
                style={styles.input}
                value={form.specialty}
                onChangeText={v => setForm(prev => ({ ...prev, specialty: v }))}
                placeholder="ex. Médico, Fisioterapeuta"
                placeholderTextColor={Color.Gray.v300}
              />

              <Text style={styles.fieldLabel}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={v => setForm(prev => ({ ...prev, phone: v }))}
                placeholder="Número de telefone"
                placeholderTextColor={Color.Gray.v300}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={v => setForm(prev => ({ ...prev, email: v }))}
                placeholder="endereço@email.com"
                placeholderTextColor={Color.Gray.v300}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Notas</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.notes}
                onChangeText={v => setForm(prev => ({ ...prev, notes: v }))}
                placeholder="Notas adicionais"
                placeholderTextColor={Color.Gray.v300}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator size="small" color={Color.white} />
                : <Text style={styles.saveBtnText}>
                    {editingId !== null ? 'Guardar Alterações' : 'Adicionar'}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ExternalProfessionalsManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl2_40,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    marginTop: Spacing.sm_8,
    textAlign: 'center',
  },
  list: {
    padding: Spacing.md_16,
    gap: Spacing.sm_8,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Color.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadowStyles.cardShadow,
    marginBottom: Spacing.sm_8,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },
  cardDetail: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: Spacing.xs_4,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl_32,
    right: Spacing.md_16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStyles.cardShadow,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Color.white,
    borderTopLeftRadius: Border.lg_16,
    borderTopRightRadius: Border.lg_16,
    padding: Spacing.md_16,
    paddingBottom: Spacing.xl_32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md_16,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.dark,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    marginBottom: Spacing.xs_4,
    marginTop: Spacing.sm_8,
  },
  input: {
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.sm_8,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: Color.primary,
    borderRadius: Border.md_12,
    paddingVertical: Spacing.md_16,
    alignItems: 'center',
    marginTop: Spacing.md_16,
  },
  saveBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
  },
});
