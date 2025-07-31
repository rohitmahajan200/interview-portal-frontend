import { useAppSelector } from '@/hooks/useAuth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { setUser } from '@/features/auth/authSlice';
import { Input } from '@/components/ui/input';
import { uploadToCloudinary } from '@/lib/clodinary';
import toast, { Toaster } from "react-hot-toast";
import api from '@/lib/api';
import { useDispatch } from 'react-redux';


export default function DocumentCRUD() {
  const documents = useAppSelector((state) => state.auth.user!.documents);
  const dispatch = useDispatch()
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [documentType, setDocumentType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState('');
  const refreshUser = async () => {
    const res = await api.get("/candidates/me");
    dispatch(setUser(res.data.user));
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType.trim()) return toast.error('Type and file required');
    try {
      const { url, publicId } = await uploadToCloudinary(selectedFile, 'candidate_docs');
      await api.post('/candidates/documents', {
        document_type: documentType,
        document_url: url,
        public_id: publicId,
      });
      toast.success('Document uploaded', {duration: 1000});
      setDocumentType('');
      setSelectedFile(null);
      setFileInputKey(prev => prev + 1);
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed', {duration: 1000});
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/candidates/documents/${id}`, { document_type: editingType });
      toast.success('Updated', {duration: 1000});
      setEditingId(null);
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed', {duration: 1000});
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/candidates/documents/${id}`);
      toast.success('Deleted', {duration: 1000});
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed', {duration: 1000});
    }
  };

  return (
    <div className="max-w-md md:max-w-2xl p-4 md:p-6 space-y-4 text-foreground bg-background m-10">
    <div className="grid gap-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <Input
            placeholder="Document Type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          />
          <Input
            key={fileInputKey}
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <Button onClick={handleUpload} disabled={!selectedFile || !documentType}>Upload Document</Button>
        </CardContent>
      </Card>

      {documents.map((doc) => (
        <Card key={doc._id}>
          <CardContent className="p-4 space-y-2">
            <div className="text-sm">
              URL:{' '}
              <a href={doc.document_url} target="_blank" className="text-blue-500 underline">
                {doc.document_url}
              </a>
            </div>
            {editingId === doc._id ? (
              <div className="flex gap-2 items-center">
                <Input
                  value={editingType}
                  onChange={(e) => setEditingType(e.target.value)}
                />
                <Button onClick={() => handleUpdate(doc._id)}>Save</Button>
                <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-semibold">{doc.document_type}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(doc._id);
                      setEditingType(doc.document_type);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(doc._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <Toaster position="top-center" />
    </div>
    </div>
  );
}
