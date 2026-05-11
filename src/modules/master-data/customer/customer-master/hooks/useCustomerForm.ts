import { useEffect, useRef } from 'react';
import { 
    useForm, 
    useFieldArray, 
    useWatch, 
    type SubmitHandler, 
    type UseFormReturn, 
    type FieldArrayWithId,
    type Resolver
} from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    customerSchema, 
    type CustomerSchemaType 
} from '@customer/customer-master/types/customer-schema';
import { 
    initialCustomerFormData, 
    toCustomerFormData,
    type CustomerMaster,
    type CustomerAddress
} from '@customer/customer-master/types/customer-types';
import { CustomerService } from '@customer/customer-master/services/customer.service';

interface UseCustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number;
    initialData?: CustomerMaster | null;
    onSuccess?: () => void;
}

export interface UseCustomerFormReturn {
    methods: UseFormReturn<CustomerSchemaType>;
    onSubmit: SubmitHandler<CustomerSchemaType>;
    headerTitle: string;
    addressFields: FieldArrayWithId<CustomerSchemaType, 'addresses', 'id'>[];
    addAddress: () => void;
    removeAddress: (index: number) => void;
    isLoading: boolean;
}

export function useCustomerForm({ 
    isOpen, 
    onClose, 
    id, 
    initialData, 
    onSuccess 
}: UseCustomerFormProps): UseCustomerFormReturn {
    const queryClient = useQueryClient();
    
    const methods = useForm<CustomerSchemaType>({
        resolver: zodResolver(customerSchema) as Resolver<CustomerSchemaType>,
        defaultValues: initialCustomerFormData,
    });

    const {
        control,
        reset,
        setValue,
        formState: { isLoading: isFormLoading },
    } = methods;

    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
        control,
        name: 'addresses',
    });

    const sameAsRegistered = useWatch({ control, name: 'same_as_registered' });
    const registeredAddress = useWatch({ control, name: 'addresses.0' });

    const prevIsOpenRef = useRef(isOpen);

    // =========================================================================
    // DATA FETCHING (useQuery)
    // =========================================================================
    
    const { data: customerData, isLoading: isFetching } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => CustomerService.getById(id!),
        enabled: !!id && isOpen,
        staleTime: 0, // Ensure we get fresh data when opening the form
    });

    // =========================================================================
    // MUTATION (useMutation)
    // =========================================================================

    const mutation = useMutation({
        mutationFn: (payload: Partial<CustomerMaster>) => 
            id 
                ? CustomerService.update(id, payload)
                : CustomerService.create(payload),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['customer-master'] });
                if (id) queryClient.invalidateQueries({ queryKey: ['customer', id] });
                
                onSuccess?.();
                onClose();
            }
        }
    });

    // =========================================================================
    // SIDE EFFECTS
    // =========================================================================

    // Sync "Same as Registered" logic
    useEffect(() => {
        if (sameAsRegistered && registeredAddress) {
            const currentContactAddress = methods.getValues('addresses.1');
            
            setValue('addresses.1', {
                ...currentContactAddress, // Keep existing metadata (id, is_default, addressType)
                address:         registeredAddress.address,
                subDistrict:     registeredAddress.subDistrict,
                district:        registeredAddress.district,
                province:        registeredAddress.province,
                postalCode:      registeredAddress.postalCode,
                country:         registeredAddress.country,
                contactPerson:   registeredAddress.contactPerson,
                email:           registeredAddress.email,
            }, { shouldDirty: true });
        }
    }, [sameAsRegistered, registeredAddress, setValue, methods]);

    // Handle Initial Data & Reset
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            if (initialData) {
                reset(toCustomerFormData(initialData));
            } else if (!id) {
                reset(initialCustomerFormData);
            }
        }
        
        // When data is fetched via useQuery
        if (isOpen && id && customerData) {
            reset(toCustomerFormData(customerData));
        }
        
        prevIsOpenRef.current = isOpen;
    }, [isOpen, id, initialData, customerData, reset]);

    // =========================================================================
    // FORM SUBMISSION
    // =========================================================================

    const onSubmit: SubmitHandler<CustomerSchemaType> = async (data) => {
        // Mapping to Backend Payload
        const mappedAddresses = data.addresses.map(a => {
            const isRealId = typeof a.id === 'number' || (typeof a.id === 'string' && !isNaN(Number(a.id)) && a.id.length < 10);
            
            const addr: Partial<CustomerAddress> = {
                address_type:    a.addressType,
                address:         a.address,
                sub_district:    a.subDistrict || undefined,
                district:        a.district,
                province:        a.province,
                postal_code:     a.postalCode,
                country:         a.country,
                contact_person:  a.contactPerson || undefined,
                phone:           a.phone || undefined,
                phone_extension: a.phoneExtension || undefined,
                email:           a.email || data.email || 'no-email@ymd.com',
                is_default:      a.is_default,
                is_active:       true
            };

            if (id && isRealId) {
                addr.customer_address_id = Number(a.id);
            }

            return addr;
        });

        const parseId = (val: string | number | null | undefined) => {
            if (!val || val === '') return undefined;
            const num = Number(val);
            return isNaN(num) ? val : num;
        };

        const commonPayload = {
            customer_code:          data.customer_code,
            customer_name:          data.customer_name_th,
            customer_nameeng:       data.customer_name_en || undefined,
            tax_id:                 data.tax_id || undefined,
            is_vat_registered:      data.vat_registered,
            customer_type_id:       parseId(data.customer_type_id),
            customer_group_id:      parseId(data.customer_group_id),
            bill_group_id:          parseId(data.billing_group_id),
            business_type_id:       parseId(data.business_type_id),
            credit_limit:           Number(data.credit_limit),
            payment_term_days:      Number(data.credit_term),
            payment_method_default: data.payment_method_id || undefined,
            contact_name:           data.contact_name || undefined,
            phone:                  data.phone || undefined,
            email:                  data.email || undefined,
            website:                data.website || undefined,
            price_level_id:         parseId(data.price_level_id),
            is_active:              data.is_active,
            addresses:              mappedAddresses,
        };

        await mutation.mutateAsync(commonPayload as Partial<CustomerMaster>);
    };

    return {
        methods,
        onSubmit,
        headerTitle: id ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่',
        addressFields,
        addAddress: () => appendAddress({
            id: Date.now().toString(),
            address: '',
            district: '',
            province: '',
            postalCode: '',
            country: 'Thailand',
            is_default: false,
            addressType: 'SHIPPING',
            subDistrict: '',
            contactPerson: '',
            phone: '',
            phoneExtension: '',
            email: ''
        }),
        removeAddress: (index: number) => {
            if (index > 1) removeAddress(index);
        },
        isLoading: isFormLoading || isFetching
    };
}

