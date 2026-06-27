import { Modal, TextInput, Textarea, NumberInput, Button, Stack, Group, SimpleGrid } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateMedication } from './useMedication'

interface Props {
  opened: boolean
  onClose: () => void
}

export function AddMedicationModal({ opened, onClose }: Props) {
  const createMedication = useCreateMedication()

  const form = useForm({
    initialValues: {
      name: '',
      dosage: '',
      frequency: '',
      dosesPerDay: 1,
      person: '',
      prescriber: '',
      pharmacy: '',
      notes: '',
      initialQuantity: 0,
      unit: 'tablets',
      reorderThreshold: 14,
    },
    validate: {
      name: (v) => (v.trim() ? null : 'Name is required'),
      dosage: (v) => (v.trim() ? null : 'Dosage is required'),
      frequency: (v) => (v.trim() ? null : 'Frequency is required'),
      person: (v) => (v.trim() ? null : 'Person is required'),
      dosesPerDay: (v) => (v > 0 ? null : 'Must be at least 1'),
    },
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  async function handleSubmit(values: typeof form.values) {
    try {
      await createMedication.mutateAsync({
        name: values.name.trim(),
        dosage: values.dosage.trim(),
        frequency: values.frequency.trim(),
        dosesPerDay: values.dosesPerDay,
        person: values.person.trim(),
        prescriber: values.prescriber.trim() || undefined,
        pharmacy: values.pharmacy.trim() || undefined,
        notes: values.notes.trim() || undefined,
        initialQuantity: values.initialQuantity,
        unit: values.unit.trim() || undefined,
        reorderThreshold: values.reorderThreshold,
      })
      notifications.show({ message: 'Medication added', color: 'green' })
      handleClose()
    } catch {
      notifications.show({ message: 'Failed to add medication', color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Add medication" size="lg">
      <form onSubmit={form.onSubmit((v) => void handleSubmit(v))}>
        <Stack gap="sm">
          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="Name"
              placeholder="e.g. Metformin"
              required
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Person"
              placeholder="e.g. Chris"
              required
              {...form.getInputProps('person')}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="Dosage"
              placeholder="e.g. 500mg"
              required
              {...form.getInputProps('dosage')}
            />
            <TextInput
              label="Frequency"
              placeholder="e.g. Twice daily"
              required
              {...form.getInputProps('frequency')}
            />
          </SimpleGrid>

          <NumberInput
            label="Doses per day"
            description="Used to calculate days remaining"
            min={1}
            max={24}
            {...form.getInputProps('dosesPerDay')}
          />

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="Prescriber"
              placeholder="Optional"
              {...form.getInputProps('prescriber')}
            />
            <TextInput
              label="Pharmacy"
              placeholder="Optional"
              {...form.getInputProps('pharmacy')}
            />
          </SimpleGrid>

          <Textarea
            label="Notes"
            placeholder="Any additional notes"
            autosize
            minRows={2}
            maxRows={4}
            {...form.getInputProps('notes')}
          />

          <SimpleGrid cols={3} spacing="sm">
            <NumberInput
              label="Initial stock"
              min={0}
              {...form.getInputProps('initialQuantity')}
            />
            <TextInput
              label="Unit"
              placeholder="tablets"
              {...form.getInputProps('unit')}
            />
            <NumberInput
              label="Reorder threshold (days)"
              min={1}
              {...form.getInputProps('reorderThreshold')}
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createMedication.isPending}>
              Add medication
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
