import os
import zipfile
from pathlib import Path

def create_project_zip():
    project_root = Path("D:/FujiNova")
    output_zip = Path("D:/FujiNova/FujiNova.zip")
    
    # Exclude directories
    exclude_dirs = {
        ".venv",
        "node_modules",
        ".git",
        "dist",
        "dist_build",
        "dist_prod",
        ".pytest_cache",
        "__pycache__",
        ".idea",
        ".vscode",
    }
    
    # Exclude files
    exclude_files = {
        "FujiNova.zip",
        "fujinova.db-shm",
        "fujinova.db-wal",
    }
    
    # Exclude extensions
    exclude_exts = {".pyc", ".pyo"}
    
    print(f"Creating zip archive at: {output_zip}")
    
    file_count = 0
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(project_root):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files:
                    continue
                if any(file.endswith(ext) for ext in exclude_exts):
                    continue
                
                full_path = Path(root) / file
                # Skip the zip file itself if it's being written
                if full_path.resolve() == output_zip.resolve():
                    continue
                
                rel_path = full_path.relative_to(project_root)
                zf.write(full_path, arcname=str(rel_path))
                file_count += 1
                
    size_mb = output_zip.stat().st_size / (1024 * 1024)
    print(f"Successfully packaged {file_count} files into {output_zip} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    create_project_zip()
