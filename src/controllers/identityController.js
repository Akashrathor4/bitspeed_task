const Contact = require('../models/Contact');

const findPrimaryContact = async (contact) => {
  if (contact.linkPrecedence === 'primary' && !contact.linkedId) {
    return contact;
  }
  if (contact.linkedId) {
    const parent = await Contact.findById(contact.linkedId);
    if (parent) {
      return findPrimaryContact(parent);
    }
  }
  return contact;
};

const getAllContactsByPrimary = async (primaryId) => {
  const all = await Contact.find({
    $or: [{ _id: primaryId }, { linkedId: primaryId }],
    deletedAt: null,
  }).sort({ createdAt: 1 });
  return all;
};
const buildResponse = (primaryContact, allContacts) => {
  const emails = [];
  const phoneNumbers = [];
  const secondaryContactIds = [];
  if (primaryContact.email && !emails.includes(primaryContact.email)) {
    emails.push(primaryContact.email);
  }
  if (primaryContact.phoneNumber && !phoneNumbers.includes(primaryContact.phoneNumber)) {
    phoneNumbers.push(primaryContact.phoneNumber);
  }

  for (const contact of allContacts) {
    if (contact._id.toString() === primaryContact._id.toString()) continue;

    if (contact.email && !emails.includes(contact.email)) {
      emails.push(contact.email);
    }
    if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
      phoneNumbers.push(contact.phoneNumber);
    }
    secondaryContactIds.push(contact._id);
  }

  return {
    contact: {
      primaryContatctId: primaryContact._id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
};

const identify = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: 'At least one of email or phoneNumber is required.',
      });
    }
 const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const normalizedPhone = phoneNumber ? String(phoneNumber).trim() : null;

    const query = [];
    if (normalizedEmail) query.push({ email: normalizedEmail });
    if (normalizedPhone) query.push({ phoneNumber: normalizedPhone });

    const matchedContacts = await Contact.find({
      $or: query,
      deletedAt: null,
    }).sort({ createdAt: 1 });

    if (matchedContacts.length === 0) {
      const newContact = await Contact.create({
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        linkPrecedence: 'primary',
        linkedId: null,
      });

      return res.status(200).json(buildResponse(newContact, [newContact]));
    }

    const primaryContactsMap = new Map();

    for (const contact of matchedContacts) {
      const primary = await findPrimaryContact(contact);
      primaryContactsMap.set(primary._id.toString(), primary);
    }

    const uniquePrimaries = Array.from(primaryContactsMap.values()).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  const truePrimary = uniquePrimaries[0];

    if (uniquePrimaries.length > 1) {
      for (let i = 1; i < uniquePrimaries.length; i++) {
        const otherPrimary = uniquePrimaries[i];
        await Contact.findByIdAndUpdate(otherPrimary._id, {
          linkPrecedence: 'secondary',
          linkedId: truePrimary._id,
          updatedAt: new Date(),
        });

        await Contact.updateMany(
          { linkedId: otherPrimary._id, deletedAt: null },
          { linkedId: truePrimary._id, updatedAt: new Date() }
        );
      }
    }

    let allContacts = await getAllContactsByPrimary(truePrimary._id);
 const clusterEmails = allContacts.map((c) => c.email).filter(Boolean);
    const clusterPhones = allContacts.map((c) => c.phoneNumber).filter(Boolean);

    const isNewEmail = normalizedEmail && !clusterEmails.includes(normalizedEmail);
    const isNewPhone = normalizedPhone && !clusterPhones.includes(normalizedPhone);

    if (isNewEmail || isNewPhone) {
      await Contact.create({
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        linkPrecedence: 'secondary',
        linkedId: truePrimary._id,
      });

      allContacts = await getAllContactsByPrimary(truePrimary._id);
    }

    const freshPrimary = await Contact.findById(truePrimary._id);

    return res.status(200).json(buildResponse(freshPrimary, allContacts));
  } catch (error) {
    console.error(' Error in /identify:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

module.exports = { identify };
