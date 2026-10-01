import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRODUCT_SECTIONS, type ProductSection } from '../../data/food';
import { addProduct, knownProducts } from '../../logic/food';
import { useStore } from '../../store/AppStore';
import { colors, gap, radius } from '../../theme';
import { Icon } from '../Icon';
import { Text, TextInput } from '../Text';
import { Button } from '../ui';
import { productName, sectionTitle } from '../../i18n/content';
import { useT } from '../../i18n/useT';

// Выбор продукта для строки ингредиента: из известных (поиск) или новый с разделом.
export function ProductPicker({ visible, onPick, onClose }: { visible: boolean; onPick: (id: string) => void; onClose: () => void }) {
  const t = useT();
  const { data, update } = useStore();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<ProductSection | null>(null);
  const all = useMemo(() => knownProducts(data.food), [data.food]);
  const q = query.trim().toLowerCase();
  const nameOf = (p: (typeof all)[number]) => productName(p.id, p.product);
  const list = q ? all.filter((p) => nameOf(p).toLowerCase().includes(q)) : all;
  const exact = all.some((p) => nameOf(p).toLowerCase() === q);

  const close = () => {
    setQuery('');
    setSection(null);
    onClose();
  };
  const pick = (id: string) => {
    onPick(id);
    close();
  };
  const create = () => {
    if (!section || !q) return;
    const { id } = addProduct(data, query, section);
    update((d) => addProduct(d, query, section, id).data);
    pick(id);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={[styles.sheet, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.head}>
          <Text style={styles.title}>{t('product.title')}</Text>
          <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.close')} style={styles.close}>
            <Icon name="close" size={22} />
          </Pressable>
        </View>
        <View style={styles.search}>
          <Icon name="magnify" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('product.search')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCorrect={false}
          />
        </View>
        {q && !exact ? (
          <View style={styles.newCard}>
            <Text style={styles.newTitle}>{t('product.new', { name: query.trim() })}</Text>
            <Text style={styles.muted}>{t('product.section')}</Text>
            <View style={styles.chips}>
              {PRODUCT_SECTIONS.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSection(s.id)}
                  style={[styles.chip, section === s.id && styles.chipActive]}
                  accessibilityState={{ selected: section === s.id }}
                >
                  <Text style={[styles.chipText, section === s.id && styles.chipTextActive]}>{sectionTitle(s.id)}</Text>
                </Pressable>
              ))}
            </View>
            <Button title={t('product.add')} onPress={create} disabled={!section} />
          </View>
        ) : null}
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => pick(item.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={styles.name}>{nameOf(item)}</Text>
              <Text style={styles.muted}>{sectionTitle(item.product.section)}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, gap },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.button },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 16, color: colors.text },
  newCard: { gap: 10, padding: 14, borderRadius: radius, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.highlight },
  newTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.button },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.onPrimary },
  list: { paddingBottom: 24 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { opacity: 0.6 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
});
