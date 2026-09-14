import { Prisma, prisma } from "@isociety/database";

const fieldsInclude = {
  fields: {
    orderBy: { displayOrder: "asc" as const },
    include: { options: { orderBy: { displayOrder: "asc" as const } } },
  },
};

export function findByEventId(eventId: string) {
  return prisma.registrationForm.findUnique({
    where: { eventId },
    include: fieldsInclude,
  });
}

export function findFieldById(fieldId: string) {
  return prisma.formField.findUnique({
    where: { id: fieldId },
    include: { form: true, options: { orderBy: { displayOrder: "asc" } } },
  });
}

interface OptionInput {
  label: string;
  value: string;
}

// Prisma's "checked" FormFieldCreateInput/UpdateInput hide raw foreign key
// scalars (like conditionFieldId) behind nested relation syntax
// (`conditionField: { connect: ... } }`). The "Unchecked" variants keep the
// plain scalar FK fields instead, which is what we actually want here.
export function createField(
  formId: string,
  data: Omit<Prisma.FormFieldUncheckedCreateInput, "formId" | "options">,
  options?: OptionInput[]
) {
  return prisma.formField.create({
    data: {
      ...data,
      formId,
      options: options
        ? { create: options.map((opt, i) => ({ ...opt, displayOrder: i })) }
        : undefined,
    },
    include: { options: { orderBy: { displayOrder: "asc" } } },
  });
}

// Replacing the option list wholesale (delete-then-recreate) instead of
// diffing individual options - simpler, and the builder always submits the
// full list anyway.
export async function updateField(
  fieldId: string,
  data: Prisma.FormFieldUncheckedUpdateInput,
  options?: OptionInput[]
) {
  return prisma.$transaction(async (tx) => {
    if (options) {
      await tx.fieldOption.deleteMany({ where: { fieldId } });
    }
    return tx.formField.update({
      where: { id: fieldId },
      data: {
        ...data,
        options: options
          ? { create: options.map((opt, i) => ({ ...opt, displayOrder: i })) }
          : undefined,
      },
      include: { options: { orderBy: { displayOrder: "asc" } } },
    });
  });
}

export function deleteField(fieldId: string) {
  return prisma.formField.delete({ where: { id: fieldId } });
}

export function reorderFields(fieldIds: string[]) {
  return prisma.$transaction(
    fieldIds.map((id, index) =>
      prisma.formField.update({ where: { id }, data: { displayOrder: index } })
    )
  );
}
