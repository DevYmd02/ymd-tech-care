import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  Upload, 
  Edit3, 
  Save, 
  X,
  FileText,
  Loader2
} from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { SectionCard } from '@/shared/components/ui/data-display/Card';
import { Input } from '@/shared/components/ui/inputs/Input';
import { ActionButton } from '@/shared/components/ui/inputs/ActionButton';
import { CompanyInfoService } from '../services/company-info.service';
import { type CompanyInfo, type CompanyInfoFormData } from '../types/company-info.types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '@/core/api/api';
import { logger } from '@/shared/utils';

/**
 * @file CompanyInfoPage.tsx
 * @description หน้ากำหนดข้อมูลบริษัท (Company Information Settings) - Real API Integrated
 * @purpose จัดการข้อมูลหลักของบริษัท เช่น โลโก้, ชื่อ, ที่อยู่ และข้อมูลติดต่อ เชื่อมต่อกับ Backend จริง
 */
const CompanyInfoPage: React.FC = () => {
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyInfo | null>(null);
  
  // States for Logo Upload
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyInfoFormData>();

  // ---------- DATA FETCHING ----------
  const fetchCompanyInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await CompanyInfoService.get();
      if (data) {
        setCompanyData(data);
        setLogoPreview(data.logo_url || null);
        reset(data);
      }
    } catch (error) {
      logger.error('Failed to fetch company info:', error);
      toast.error('ไม่สามารถดึงข้อมูลบริษัทได้: ' + extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  // ---------- LOGO HANDLERS ----------
  const handleLogoClick = () => {
    // ให้สามารถเลือกไฟล์ได้เฉพาะตอนแก้ไข หรือตาม UX ที่ต้องการ (ในที่นี้ให้เลือกได้ทุกเมื่อแต่บันทึกตอนกด Save)
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 2MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Auto-switch to edit mode if not already
      if (!isEdit) setIsEdit(true);
    }
  };

  // ---------- FORM HANDLERS ----------
  const toggleEdit = () => {
    if (isEdit) {
      // Revert if cancelling
      if (companyData) {
        reset(companyData);
        setLogoPreview(companyData.logo_url || null);
      }
      setSelectedFile(null);
    }
    setIsEdit(!isEdit);
  };

  const onSubmit = async (data: CompanyInfoFormData) => {
    if (!companyData && !isEdit) return;
    
    setIsSaving(true);
    try {
      // 1. Upload Logo if selected
      let finalLogoUrl = companyData?.logo_url;
      if (selectedFile) {
        const uploadRes = await CompanyInfoService.uploadLogo(selectedFile);
        if (uploadRes.success) {
          finalLogoUrl = uploadRes.logo_url;
        }
      }

      // 2. Update Company Info
      const updateData = { ...data, logo_url: finalLogoUrl };
      const response = await CompanyInfoService.update(companyData?.company_id || 0, updateData);
      
      if (response.success) {
        toast.success('บันทึกข้อมูลบริษัทสำเร็จ');
        setCompanyData(response.data || null);
        setIsEdit(false);
        setSelectedFile(null);
      }
    } catch (error) {
      toast.error('บันทึกข้อมูลไม่สำเร็จ: ' + extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- RENDER HELPERS ----------
  const renderField = (label: string, value: string | undefined, name: keyof CompanyInfoFormData, required = false) => {
    return (
      <div className="flex flex-col space-y-1">
        <label className={styles.label}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isEdit ? (
          <Input 
            name={name} 
            register={register} 
            error={!!errors[name]}
            placeholder={label}
            className={styles.input}
          />
        ) : (
          <div className={`${styles.input} ${styles.bg.subtle} flex items-center bg-gray-50/50 dark:bg-gray-800/30 truncate`}>
            {value || '-'}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">กำลังโหลดข้อมูลบริษัท...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className={`${styles.title} flex items-center gap-3`}>
            <div className={`p-2 rounded-xl bg-blue-600 text-white shadow-lg`}>
              <Building2 size={24} />
            </div>
            กำหนดข้อมูลบริษัท
          </h1>
          <p className={`${styles.muted} mt-1 ml-12`}>จัดการข้อมูลหลักและเอกลักษณ์ขององค์กร</p>
        </div>

        <div className="flex items-center gap-2">
          {!isEdit ? (
            <ActionButton 
              icon={<Edit3 size={16} />} 
              label="แก้ไขข้อมูล" 
              onClick={toggleEdit}
              variant="primary"
            />
          ) : (
            <>
              <ActionButton 
                icon={<X size={16} />} 
                label="ยกเลิก" 
                onClick={toggleEdit}
                variant="default"
                disabled={isSaving}
              />
              <ActionButton 
                icon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                label={isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"} 
                onClick={handleSubmit(onSubmit)}
                variant="success"
                disabled={isSaving}
              />
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ---------- LOGO SECTION ---------- */}
        <SectionCard 
          title="โลโก้บริษัท" 
          titleIcon={<Upload size={18} />}
          className="overflow-hidden border-t-4 border-t-blue-500"
        >
          <div className="flex flex-col md:flex-row items-start gap-8 py-2">
            <div className="relative group">
              <div 
                onClick={handleLogoClick}
                className={`w-40 h-40 rounded-3xl border-2 border-dashed ${selectedFile ? 'border-blue-500 bg-blue-50/30' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden transition-all hover:border-blue-400 group-hover:shadow-inner cursor-pointer relative`}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                    <Building2 size={48} strokeWidth={1} />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="text-white" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-center mt-2 text-gray-500 uppercase tracking-widest font-bold">Recommended: 512x512 PNG</p>
            </div>
            
            <div className="flex-1 space-y-4">
               <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-2">
                    <FileText size={14} /> คำแนะนำการอัปโหลด
                  </h4>
                  <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 space-y-1 ml-5 list-disc leading-relaxed">
                    <li>รองรับไฟล์นามสกุล .png, .jpg, .svg</li>
                    <li>ขนาดไฟล์ไม่เกิน 2MB เพื่อประสิทธิภาพสูงสุด</li>
                    <li>ควรใช้รูปที่มีพื้นหลังโปร่งใส (Transparency) ถ้าเป็นไปได้</li>
                  </ul>
               </div>
               
               {selectedFile && (
                 <div className="flex items-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 p-2 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-left-2">
                    <Save size={14} /> เตรียมอัปโหลดไฟล์: {selectedFile.name}
                 </div>
               )}
            </div>
          </div>
        </SectionCard>

        {/* ---------- GENERAL INFO SECTION ---------- */}
        <SectionCard 
          title="ข้อมูลทั่วไป" 
          titleIcon={<FileText size={18} />}
          className="border-t-4 border-t-indigo-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
            {renderField('รหัสบริษัท', companyData?.company_code, 'company_code', true)}
            {renderField('เลขทะเบียนนิติบุคคล', companyData?.registration_number, 'registration_number', true)}
            {renderField('เลขประจำตัวผู้เสียภาษี', companyData?.tax_id, 'tax_id', true)}
          </div>
          <div className="grid grid-cols-1 gap-6 mt-4">
            {renderField('ชื่อบริษัท (ไทย)', companyData?.name_th, 'name_th', true)}
            {renderField('ชื่อบริษัท (English)', companyData?.name_en, 'name_en', true)}
          </div>
        </SectionCard>

        {/* ---------- ADDRESS SECTION ---------- */}
        <SectionCard 
          title="ที่อยู่" 
          titleIcon={<MapPin size={18} />}
          className="border-t-4 border-t-emerald-500"
        >
          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-1">
              <label className={styles.label}>ที่อยู่ (ไทย) <span className="text-red-500">*</span></label>
              {isEdit ? (
                <textarea 
                  {...register('address_th')}
                  className={`${styles.textarea} min-h-[80px]`}
                  placeholder="เลขที่อาคาร, ถนน, แขวง/ตำบล, เขต/อำเภอ"
                />
              ) : (
                <div className={`${styles.textarea} ${styles.bg.subtle} min-h-[80px] bg-gray-50/50 dark:bg-gray-800/30`}>
                  {companyData?.address_th || '-'}
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <label className={styles.label}>ที่อยู่ (English) <span className="text-red-500">*</span></label>
              {isEdit ? (
                <textarea 
                  {...register('address_en')}
                  className={`${styles.textarea} min-h-[80px]`}
                  placeholder="Building No, Street, Sub-district, District"
                />
              ) : (
                <div className={`${styles.textarea} ${styles.bg.subtle} min-h-[80px] bg-gray-50/50 dark:bg-gray-800/30`}>
                  {companyData?.address_en || '-'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('จังหวัด', companyData?.province, 'province')}
              {renderField('รหัสไปรษณีย์', companyData?.zip_code, 'zip_code')}
            </div>
          </div>
        </SectionCard>

        {/* ---------- CONTACT SECTION ---------- */}
        <SectionCard 
          title="ข้อมูลติดต่อ" 
          titleIcon={<Phone size={18} />}
          className="border-t-4 border-t-purple-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
            <div className="flex flex-col space-y-1">
               <label className={styles.label}><span className="flex items-center gap-2"><Phone size={14} /> โทรศัพท์</span></label>
               {isEdit ? (
                 <Input name="phone" register={register} className={styles.input} />
               ) : (
                 <div className={`${styles.input} ${styles.bg.subtle} bg-gray-50/50 dark:bg-gray-800/30`}>{companyData?.phone || '-'}</div>
               )}
            </div>
            
            <div className="flex flex-col space-y-1">
               <label className={styles.label}><span className="flex items-center gap-2"><Mail size={14} /> อีเมล</span></label>
               {isEdit ? (
                 <Input name="email" register={register} className={styles.input} />
               ) : (
                 <div className={`${styles.input} ${styles.bg.subtle} bg-gray-50/50 dark:bg-gray-800/30`}>{companyData?.email || '-'}</div>
               )}
            </div>

            <div className="flex flex-col space-y-1">
               <label className={styles.label}><span className="flex items-center gap-2"><Globe size={14} /> เว็บไซต์</span></label>
               {isEdit ? (
                 <Input name="website" register={register} className={styles.input} />
               ) : (
                 <div className={`${styles.input} ${styles.bg.subtle} bg-gray-50/50 dark:bg-gray-800/30`}>{companyData?.website || '-'}</div>
               )}
            </div>
          </div>
        </SectionCard>
      </form>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-2 py-4 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
        <span>Master Data v1.0</span>
        <span className="flex items-center gap-2">
           System Active <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </span>
      </div>
    </div>
  );
};

export default CompanyInfoPage;
