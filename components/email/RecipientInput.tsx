"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Mail, User } from "lucide-react";
import { getContacts } from "@/lib/firestore/contacts";
import { useOrgStore } from "@/store/org";
import type { EmailRecipient } from "@/types/email";
import type { Contact } from "@/types/crm";
import { isValidEmail, parseEmailString } from "@/lib/email/merge-fields";

interface RecipientInputProps {
    recipients: EmailRecipient[];
    onChange: (recipients: EmailRecipient[]) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
}

export function RecipientInput({
    recipients,
    onChange,
    placeholder = "Add recipients...",
    label,
    disabled = false,
}: RecipientInputProps) {
    const { currentOrg } = useOrgStore();
    const organizationId = currentOrg?.id;
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<Contact[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch contacts on mount
    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        const { contacts: fetchedContacts } = await getContacts(organizationId);
        setContacts(fetchedContacts);
    };

    // Filter suggestions based on input
    useEffect(() => {
        if (inputValue.trim().length > 0) {
            const searchLower = inputValue.toLowerCase();
            const filtered = contacts.filter(
                (contact) =>
                    contact.firstName.toLowerCase().includes(searchLower) ||
                    contact.lastName.toLowerCase().includes(searchLower) ||
                    contact.email.toLowerCase().includes(searchLower) ||
                    contact.companyName?.toLowerCase().includes(searchLower)
            );
            setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [inputValue, contacts]);

    const addRecipient = (recipient: EmailRecipient) => {
        // Check for duplicates
        const isDuplicate = recipients.some((r) => r.email === recipient.email);
        if (isDuplicate) {
            return;
        }

        onChange([...recipients, recipient]);
        setInputValue("");
        setShowSuggestions(false);
    };

    const removeRecipient = (email: string) => {
        onChange(recipients.filter((r) => r.email !== email));
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            handleAddFromInput();
        } else if (e.key === "Backspace" && inputValue === "" && recipients.length > 0) {
            // Remove last recipient on backspace
            removeRecipient(recipients[recipients.length - 1].email);
        }
    };

    const handleAddFromInput = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        const parsed = parseEmailString(trimmed);
        const recipient: EmailRecipient = {
            email: parsed.email,
            name: parsed.name,
            isValid: isValidEmail(parsed.email),
        };

        addRecipient(recipient);
    };

    const handleSelectContact = (contact: Contact) => {
        const recipient: EmailRecipient = {
            email: contact.email,
            name: `${contact.firstName} ${contact.lastName}`,
            contactId: contact.id,
            isValid: true,
        };

        addRecipient(recipient);
    };

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium">{label}</label>}

            <div className="relative">
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-ring">
                    {recipients.map((recipient) => (
                        <Badge
                            key={recipient.email}
                            variant={recipient.isValid ? "secondary" : "destructive"}
                            className="flex items-center gap-1 px-2 py-1"
                        >
                            {recipient.name ? (
                                <>
                                    <User className="h-3 w-3" />
                                    <span>{recipient.name}</span>
                                    <span className="text-muted-foreground text-xs">
                                        &lt;{recipient.email}&gt;
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Mail className="h-3 w-3" />
                                    <span>{recipient.email}</span>
                                </>
                            )}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => removeRecipient(recipient.email)}
                                    className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onBlur={() => {
                            // Delay to allow click on suggestions
                            setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        onFocus={() => {
                            if (inputValue.trim().length > 0) {
                                setShowSuggestions(true);
                            }
                        }}
                        placeholder={recipients.length === 0 ? placeholder : ""}
                        disabled={disabled}
                        className="flex-1 min-w-[200px] outline-none bg-transparent"
                    />
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {suggestions.map((contact) => (
                            <button
                                key={contact.id}
                                type="button"
                                onClick={() => handleSelectContact(contact)}
                                className="w-full px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 group"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900 group-hover:text-slate-900 text-sm">
                                        {contact.firstName} {contact.lastName}
                                    </div>
                                    <div className="text-xs text-slate-500 group-hover:text-slate-600">
                                        {contact.email}
                                    </div>
                                    {contact.companyName && (
                                        <div className="text-xs text-muted-foreground">
                                            {contact.companyName}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!recipients.every((r) => r.isValid) && (
                <p className="text-sm text-destructive">
                    Some email addresses are invalid
                </p>
            )}
        </div>
    );
}
