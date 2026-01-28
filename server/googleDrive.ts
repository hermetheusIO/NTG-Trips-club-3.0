import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

export async function listDriveFolders(): Promise<DriveFolder[]> {
  const drive = await getUncachableGoogleDriveClient();
  
  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id, name)',
    orderBy: 'name',
    pageSize: 100
  });

  return (response.data.files || []).map(f => ({
    id: f.id!,
    name: f.name!
  }));
}

export async function listFolderImages(folderId: string): Promise<DriveFile[]> {
  const drive = await getUncachableGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
    fields: 'files(id, name, mimeType, thumbnailLink, webContentLink, webViewLink, size, createdTime)',
    orderBy: 'createdTime desc',
    pageSize: 500
  });

  return (response.data.files || []).map(f => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    thumbnailLink: f.thumbnailLink || undefined,
    webContentLink: f.webContentLink || undefined,
    webViewLink: f.webViewLink || undefined,
    size: f.size || undefined,
    createdTime: f.createdTime || undefined
  }));
}

export async function getFileDownloadUrl(fileId: string): Promise<string> {
  const drive = await getUncachableGoogleDriveClient();
  
  const file = await drive.files.get({
    fileId,
    fields: 'webContentLink'
  });

  return file.data.webContentLink || '';
}

export async function downloadFileBuffer(fileId: string): Promise<Buffer> {
  const drive = await getUncachableGoogleDriveClient();
  
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

export async function getFileMetadata(fileId: string): Promise<DriveFile | null> {
  const drive = await getUncachableGoogleDriveClient();
  
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, thumbnailLink, webContentLink, webViewLink, size, createdTime'
    });

    const f = response.data;
    return {
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      thumbnailLink: f.thumbnailLink || undefined,
      webContentLink: f.webContentLink || undefined,
      webViewLink: f.webViewLink || undefined,
      size: f.size || undefined,
      createdTime: f.createdTime || undefined
    };
  } catch {
    return null;
  }
}

export async function createDriveFolder(name: string, parentId?: string): Promise<DriveFolder> {
  const drive = await getUncachableGoogleDriveClient();
  
  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    },
    fields: 'id, name'
  });

  return {
    id: response.data.id!,
    name: response.data.name!
  };
}
